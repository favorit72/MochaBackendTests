const chai = require('chai');
const expect = chai.expect;
const app = require('../src');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

let request;
let server;

const correctCredentials = {
    "login": "default_admin",
    "password": "135xx642"
};

const invalidCredentials = {
    "login": "default_admin",
    "password": "135its123123123o642SSSASD"
};

describe('Тесты для проверки работоспособности методов авторизации', async () => {
    before(async () => {
        server = await app.init;
        request = chai.request(server).keepOpen();
    });

    after(() => {
        request.close();
    });

    describe('Авторизация с корректными данными', async () => {
        it('Авторизация с корректными данными, ожидается 200', async () => {
            let response = await request
                .post(`/xx-api/v1/auth/admin/sign-in`)
                .send(correctCredentials);
            expect(response).to.have.status(200);
        });
    });

    describe('Проверка отображения ошибок', async () => {
        it('Авторизация с данными несуществующего пользователя, ожидается 401', async () => {
            let response = await request
                .post(`/xx-api/v1/auth/admin/sign-in`)
                .send(invalidCredentials);
            expect(response).to.have.status(401);
        });

        it.skip('Совершение 5 неудачных попыток авторизации, ожидается код 429', async () => {
            for (var i = 0; i <= 4; i++) {
                let response = await request
                    .post(`/xx-api/v1/auth/admin/sign-in`)
                    .send(invalidCredentials);
            }
            let response = await request
                .post(`/xx-api/v1/auth/admin/sign-in`)
                .send(invalidCredentials);
            expect(response).to.have.status(429);
        });
    });
});
