import { readFileSync } from 'fs';

const appConfig =JSON.parse(readFileSync('./config.json', 'utf8'));


// ***************** App Advanced Configuration ***************** //

// App Version
appConfig.version = "POC version 1.0";
appConfig.appPort = 3000;



export default appConfig; 