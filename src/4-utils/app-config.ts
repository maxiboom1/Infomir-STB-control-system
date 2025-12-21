class AppConfig {

    // Server Port:
    public port = 4000;

    // Database Host (on which computer the database exists):
    public sqlHost = "localhost";

    // Database User
    public sqlUser = "root";

    // Database Password: 
    public sqlPassword = "123456";

    // Database Name: 
    public sqlDatabase = "stbControl"; // Fill in database name
}

const appConfig = new AppConfig();

export default appConfig;
