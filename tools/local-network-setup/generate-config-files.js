const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
require('dotenv').config('.env');

const numberOfNodes = process.argv.length === 3 ? parseInt(process.argv[2], 10) : 4;

const templatePath = './tools/local-network-setup/.dh_origintrail_noderc';
const bootstrapTemplatePath = './tools/local-network-setup/.bootstrap_origintrail_noderc';

const template = JSON.parse(fs.readFileSync(templatePath));
const bootstrapTemplate = JSON.parse(fs.readFileSync(bootstrapTemplatePath));

console.log('Preparing keys for blockchain');

if (!process.env.PRIVATE_KEY || !process.env.PUBLIC_KEY) {
    console.log('Missing blockchain keys in .env file');
    process.exit(1);
}

template.modules.blockchain.implementation['web3-service'].config.publicKey =
    process.env.PUBLIC_KEY;
template.modules.blockchain.implementation['web3-service'].config.privateKey =
    process.env.PRIVATE_KEY;
bootstrapTemplate.modules.blockchain.implementation['web3-service'].config.publicKey =
    process.env.PUBLIC_KEY;
bootstrapTemplate.modules.blockchain.implementation['web3-service'].config.privateKey =
    process.env.PRIVATE_KEY;

fs.writeFileSync(bootstrapTemplatePath, JSON.stringify(bootstrapTemplate, null, 2));

console.log(`Generating ${numberOfNodes} total nodes`);

for (let i = 0; i < numberOfNodes; i += 1) {
    let nodeName;
    if (i === 0) {
        console.log('Using the preexisting identity for the first node (bootstrap)');
        nodeName = 'bootstrap';
        continue;
    } else {
        nodeName = `DH${i}`;
    }
    console.log(`Configuring node ${nodeName}`);

    const configPath = path.join(`./tools/local-network-setup/.dh${i}_origintrail_noderc`);
    execSync(`touch ${configPath}`);

    const parsedTemplate = JSON.parse(JSON.stringify(template));

    parsedTemplate.modules.httpClient.implementation['express-http-client'].config.port = 8900 + i;
    parsedTemplate.modules.network.implementation['libp2p-service'].config.port = 9000 + i;
    parsedTemplate.modules.repository.implementation[
        'sequelize-repository'
    ].config.database = `operationaldb${i}`;
    parsedTemplate.modules.tripleStore.implementation[
        'ot-graphdb'
    ].config.repository = `repostiory${i}`;
    parsedTemplate.graphDatabase.name = `node${i}`;
    if (process.env.LOG_LEVEL) {
        parsedTemplate.logLevel = process.env.LOG_LEVEL;
    }

    fs.writeFileSync(`${configPath}`, JSON.stringify(parsedTemplate, null, 2));
}
