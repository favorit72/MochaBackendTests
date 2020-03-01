const chai = require('chai');
const expect = chai.expect;
const app = require('../src');
const chaiHttp = require('chai-http');
const assert = require('chai').assert;
chai.use(chaiHttp);

let request;
let server;
let adminToken;
let resourceId;
let defectId;

function random() {
    return Math.floor(Math.random() * Math.floor(1000));
}

const correctCredentials = {
    "login": "default_admin",
    "password": "135xx642"
};

const validDefect = {
    "assignedAt": "string",
    "organizationId": 0,
    "comment": "string",
    "causeFailureComment": "Test ",
    "state": 0,
    "reportedAt": "2019-12-17T07:44:38.734Z"
};

const updatedDefect = {
    "assignedAt": "Влад",
    "organizationId": 0,
    "comment": "Измененный коммент",
    "causeFailureComment": "Измененный failure comment ",
    "state": 0,
    "reportedAt": "2019-12-17T07:48:38.734Z"
};

const invalidDefect = {
    "assignedAt": "string",
    "organizationId": 1023,
    "comment": "string",
    "causeFailureComment": "",
    "state": 0,
    "reportedAt": "2019-15-12T06:54:45.169Z"
};

const validEquipment = {
    "systemType": "Противопехотная мина",
    "brand": "Смарт Inc.",
    "model": "К-1488",
    "location": "Москва",
    "categoryId": 9
};

const validObject = {
    "name": "TestObject " + random(),
    "regionId": 2,
    "district": "Центрально-северно-южный с намеком на восток",
    "organizationName": "ООО Рога кота и копыта собаки"
};

const validOrganization = {
    "name": "Roga Losya",
    "inn": "123123123123-12312312 " + random(),
    "comment": "Тест информация по организации",
    "regionIds": [2]
};

describe('CRUD дефектов', async () => {
    before(async () => {
        server = await app.init;
        request = chai.request(server).keepOpen();

        let response = await request
            .post(`/xx-api/v1/auth/admin/sign-in`)
            .send(correctCredentials);
        adminToken = response.body.data.user.accessToken;

        let resource = await request
            .post(`/xx-api/v1/resources`)
            .set({"Authorization-Header-Custom": adminToken})
            .attach('file', 'e2e/korgo.jpg');
        resourceId = resource.body.data.id;
        validObject.resourceIds = [resourceId];
        validDefect.resourceIds = [resourceId];

        let object = await request
            .post(`/xx-api/v1/objects`)
            .set({"Authorization-Header-Custom": adminToken})
            .send(validObject);
        validEquipment.objectId = object.body.data.id;

        let equipment = await request
            .post(`/xx-api/v1/equipments`)
            .set({"Authorization-Header-Custom": adminToken})
            .send(validEquipment);
        validDefect.equipmentId = equipment.body.data.id;
        updatedDefect.equipmentId = equipment.body.data.id;

        let organization = await request
            .post(`/xx-api/v1/organizations`)
            .set({"Authorization-Header-Custom": adminToken})
            .send(validOrganization);
        validDefect.organizationId = organization.body.data.id;
        updatedDefect.organizationId = organization.body.data.id;
    });

    after(() => {
        request.close();
    });

    describe('Create defect', async () => {
        it('Создание неисправности, ожидается 200', async () => {
            let response = await request
                .post(`/xx-api/v1/defects`)
                .set({"Authorization-Header-Custom": adminToken})
                .send(validDefect);
            defectId = response.body.data.id;
            expect(response).to.have.status(200);
            expect(response.body.data).to.have.all.keys(
                'id',
                'stringId',
                'equipmentId',
                'assignedAt',
                'state',
                'comment',
                'causeFailureComment',
                'organizationId',
                'resources',
                'equipment',
                'organization',
                'reportedAt',
                'createdAt',
                'createdBy',
                'updatedAt',
                'updatedBy',
                'spentRepairTime',
                'repairStartedAt',
                'repairFinishedAt',
                'closedAt');
        });

        it('Создание с невалидным токеном, ожидается 401', async () => {
            let response = await request
                .post(`/xx-api/v1/defects`)
                .set({"Authorization-Header-Custom": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOjEsImxvZ2luIjoiOGY3MDBlZTE1NzYwODk1NWJjNTRkMTRiMjJhNzBjY2VjZWNmOTQ2NDFhYjBmMzM2YTc1ZDIwMmI0MzY4ZDJjZCIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE1NzU4MDAzMTcsImV4cCI6MTU3NTg4NjcxN30.oHqJWIfLKLecGzHbJVQMuzqxE_tgzN78Rybx7bqkRFM"})
                .send(validDefect);
            expect(response).to.have.status(401);
        });

        it('Создание с невалидными данными, ожидается 400', async () => {
            let response = await request
                .post(`/xx-api/v1/defects`)
                .set({"Authorization-Header-Custom": adminToken})
                .send(invalidDefect);
            expect(response).to.have.status(400);
        });
    });

    describe('Read defects', async () => {
        it('Запрос списка неисправностей, ожидается 200', async () => {
            let response = await request
                .get(`/xx-api/v1/defects`)
                .set({"Authorization-Header-Custom": adminToken});
            expect(response).to.have.status(200);
            expect(response.body.data.items.length).to.not.equal(0); //проверка того, что массив неисправностей не пустой
        });

        it('Запрос списка неисправностей с невалидным токеном, ожидается 401', async () => {
            let response = await request
                .get(`/xx-api/v1/defects`)
                .set({"Authorization-Header-Custom": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOjEsImxvZ2luIjoiOGY3MDBlZTE1NzYwODk1NWJjNTRkMTRiMjJhNzBjY2VjZWNmOTQ2NDFhYjBmMzM2YTc1ZDIwMmI0MzY4ZDJjZCIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE1NzU4MDAzMTcsImV4cCI6MTU3NTg4NjcxN30.oHqJWIfLKLecGzHbJVQMuzqxE_tgzN78Rybx7bqkRFM"})
            expect(response).to.have.status(401);
        });

        it('Запрос списка неисправности по id, ожидается 200', async () => {
            let response = await request
                .get(`/xx-api/v1/defects?filter=id%20eq%20${defectId}`)
                .set({"Authorization-Header-Custom": adminToken});
            expect(response).to.have.status(200);
            expect(response.body.data.items[0].id).to.equal(defectId); //проверка id возвращенной неисправности на соответствие запрошенному id
        });

        it('Запрос несуществующей исправности, ожидается пустой массив items', async () => {
            let response = await request
                .get(`/xx-api/v1/defects?filter=id%20eq%20999999`)
                .set({"Authorization-Header-Custom": adminToken});
            expect(response).to.have.status(200);
            expect(response.body.data.items.length).to.equal(0);
        });
    });

    describe('Update defects', async () => {
        it('Обновление неисправности, ожидается 200', async () => {
            let response = await request
                .put(`/xx-api/v1/defects/${defectId}`)
                .set({"Authorization-Header-Custom": adminToken})
                .send(updatedDefect);
            expect(response).to.have.status(200);
            expect(response.body.data.assignedAt).to.equal(updatedDefect.assignedAt);
            expect(response.body.data.comment).to.equal(updatedDefect.comment);
            expect(response.body.data.causeFailureComment).to.equal(updatedDefect.causeFailureComment);
        });

        it('Обновление неисправности с невалидным токеном, ожидается 401', async () => {
            let response = await request
                .put(`/xx-api/v1/defects/${defectId}`)
                .set({"Authorization-Header-Custom": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOjEsImxvZ2luIjoiOGY3MDBlZTE1NzYwODk1NWJjNTRkMTRiMjJhNzBjY2VjZWNmOTQ2NDFhYjBmMzM2YTc1ZDIwMmI0MzY4ZDJjZCIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE1NzU4MDAzMTcsImV4cCI6MTU3NTg4NjcxN30.oHqJWIfLKLecGzHbJVQMuzqxE_tgzN78Rybx7bqkRFM"})
                .send(updatedDefect);
            expect(response).to.have.status(401);
        });

        it('Обновление несуществующей организации, ожидается 400', async () => {
            let response = await request
                .put(`/xx-api/v1/defects/12323`)
                .set({"Authorization-Header-Custom": adminToken})
                .send(updatedDefect);
            expect(response).to.have.status(400);
        });
    });

    describe('Delete defect', async () => {
        it('Удаление организации, ожидается 200', async () => {
            let response = await request
                .delete(`/xx-api/v1/defects/${defectId}`)
                .set({"Authorization-Header-Custom": adminToken});
            expect(response).to.have.status(200);
            expect(response.body.code).to.equal('success');
            expect(response.body.data).to.equal(null);
        });

        it('Проверка удаления неисправности', async () => {
            let response = await request
                .get(`/xx-api/v1/defects?filter=id%20eq%20${defectId}`)
                .set({"Authorization-Header-Custom": adminToken});
            expect(response).to.have.status(200);
            expect(response.body.data.items[0].state).to.equal(3); //статус 3 = пометка на удаление
        });
    });
});
