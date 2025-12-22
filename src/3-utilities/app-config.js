import { readFileSync } from 'fs';

const appConfig =JSON.parse(readFileSync('./config.json', 'utf8'));


// ***************** App Advanced Configuration ***************** //

// App Version
appConfig.version = "0.1";
appConfig.appPort = 3000;

export default appConfig; 