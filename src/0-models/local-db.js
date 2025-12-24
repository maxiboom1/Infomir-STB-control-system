const suffix = "sendqtevent -kqt ";

const constants = Object.freeze({
    commands: Object.freeze({
      UP:    suffix+"0x01000013",
      DOWN:  suffix+"0x01000015",
      LEFT:  suffix+"0x01000012",
      RIGHT: suffix+"0x01000014",
      OK:    suffix+"0x01000004",
      RETURN:suffix+"0x01000003",
      MENU:  suffix+"0x0100003a",
    }),
    ssh: Object.freeze({
      port: 22,
      user: "username",
      password: "password",
    }),
  });

  
  export default constants;