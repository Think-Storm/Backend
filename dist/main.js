"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const user_module_1 = require("./modules/user/user.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(user_module_1.UserModule);
    await app.listen(3000);
}
bootstrap();
//# sourceMappingURL=main.js.map