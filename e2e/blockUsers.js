const chai = require('chai');
const expect = chai.expect;
const app = require('../src');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

let request;
let server;
let adminToken;
let userId;

const correctCredentials = {
    "login": "default_admin",
    "password": "135xx642"
};

const validUserData = {
    "login": "testLogin123",
    "roleId": 6,
    "organizationName": "Рога и копыта",
    "post": "Тест пост",
    "fullName": "Юзер для блокировки",
    "objectIds": [
        5
    ],
    "email": "block@mail.com",
    "phoneNumber": "88005553577"
};

describe('Block users', async () => {
    before(async () => {
        server = await app.init;
        request = chai.request(server).keepOpen();

        let response = await request
            .post(`/xx-api/v1/auth/admin/sign-in`)
            .send(correctCredentials);
        adminToken = response.body.data.user.accessToken;
    });

    after(async () => {
        request.close();
    });

    describe('PUT users', async () => {
        before(async () => {
            let response = await request
                .post(`/xx-api/v1/users`)
                .set({"Authorization-Header-Custom": adminToken})
                .send(validUserData);
            userId = response.body.data.id;
        });

        it('Блокировка юзера, ожидается 200', async () => {
            let response = await request
                .put(`/xx-api/v1/users/${userId}/state`)
                .set({"Authorization-Header-Custom": adminToken})
                .send({"newState": 1});
            expect(response).to.have.status(200);
            expect(response.body.data.state).to.equal(1);  //ожидается получить в теле ответа новый статус
        });
    });
});
