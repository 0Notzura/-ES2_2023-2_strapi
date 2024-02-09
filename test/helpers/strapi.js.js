//path: ./tests/helpers/strapi.js
const Strapi = require("@strapi/strapi");
const fs = require("fs");
const _ = require("lodash");

let instance;

async function setupStrapi() {
  if (!instance) {
    await Strapi().load();
    instance = strapi;
    
    await instance.server.mount();
  }
  return instance;
}

async function teardownStrapi() {
  const dbSettings = strapi.config.get("database.connection");

  //Fecha o servidor para o envio do db file
  await strapi.server.httpServer.close();

  //Fecha a conexão com o banco de dados antes de deletar
  await strapi.db.connection.destroy();

  //Deleta a database teste depois de todos os testes serem completados
  if (dbSettings && dbSettings.connection && dbSettings.connection.filename) {
    const tmpDbFile = dbSettings.connection.filename;
    if (fs.existsSync(tmpDbFile)) {
      fs.unlinkSync(tmpDbFile);
    }
  }
}

module.exports = { setupStrapi, teardownStrapi };



/**
* Retorna um JWT token válido para autenticacao
* @param {String | number} idOrEmail, either user id, or email
*/
const jwt = (idOrEmail) =>
strapi.plugins["users-permissions"].services.jwt.issue({
  [Number.isInteger(idOrEmail) ? "id" : "email"]: idOrEmail,
});


//Garante permissao a tabela da database para ser possivel acessar os controladores e os endpoints

const grantPrivilege = async (
 roleID = 1,
 path,
 enabled = true,
 policy = ""
) => {
const service = strapi.plugin("users-permissions").service("role");

const role = await service.findOne(roleID);

_.set(role.permissions, path, { enabled, policy });

return service.updateRole(roleID, role);
};


const grantPrivileges = async (roleID = 1, values = []) => {
   await Promise.all(values.map((val) => grantPrivilege(roleID, val)));
};


const updatePluginStore = async (
pluginName,
key,
newValues,
environment = ""
) => {
const pluginStore = strapi.store({
  environment: environment,
  type: "plugin",
  name: pluginName,
});

const oldValues = await pluginStore.get({ key });
const newValue = Object.assign({}, oldValues, newValues);

return pluginStore.set({ key: key, value: newValue });
};

//Recebe os plugins

const getPluginStore = (pluginName, key, environment = "") => {
const pluginStore = strapi.store({
  environment: environment,
  type: "plugin",
  name: pluginName,
});

return pluginStore.get({ key });
};


//Checa se possui erro com o ID recebido
const responseHasError = (errorId, response) => {
return response && response.error && response.error.name === errorId;
};
