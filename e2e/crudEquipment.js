const chai = require('chai');
const expect = chai.expect;
const app = require('../src');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

let request;
let server;
let adminToken;
let equipmentId;
let resourceId;

function random() {
    return Math.floor(Math.random() * Math.floor(1000));
}

const correctCredentials = {
    "login": "default_admin",
    "password": "135xx642"
};

const validEquipment = {
    "systemType": "Противопехотная мина",
    "brand": "Смарт Inc.",
    "model": "К-1488",
    "location": "Москва",
    "categoryId": 9
};

const updatedEquipment = {
    "systemType": "Противотанковая мина1",
    "brand": "Test Inc.1",
    "model": "К-14991",
    "location": "Воронеж",
    "categoryId": 9
};

const invalidEquipment = {
    "systemType": "Противопехотная мина",
    "brand": "Смарт Inc.",
    "location": "Москва"
};

//объект нужен, т.к. без объекта нельзя создать оборудование
const validObject = {
    "name": "TestObject " + random(),
    "regionId": 1,
    "district": "Центрально-северно-южный с намеком на восток",
    "organizationName": "ООО Рога кота и копыта собаки"
};

describe('Crud оборудования', async () => {
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
    });

    after(() => {
        request.close();
    });

    describe('Create equipment', async () => {
        before(async () => {
            let response = await request
                .post(`/xx-api/v1/objects`)
                .set({"Authorization-Header-Custom": adminToken})
                .send(validObject);
            validEquipment.objectId = response.body.data.id;
            updatedEquipment.objectId = response.body.data.id;
        });

        it('Создание оборудования с токеном админа, ожидается 200', async () => {
            let response = await request
                .post(`/xx-api/v1/equipments`)
                .set({"Authorization-Header-Custom": adminToken})
                .send(validEquipment);
            equipmentId = response.body.data.id;
            expect(response).to.have.status(200);
            expect(response.body.data).have.all.keys(
                'categoryId',
                'id',
                'objectId',
                'systemType',
                'brand',
                'model',
                'location',
                'state',
                'createdBy',
                'createdAt',
                'updatedBy',
                'updatedAt');
            expect(response.body.data.systemType).to.equal(validEquipment.systemType);
            expect(response.body.data.brand).to.equal(validEquipment.brand);
            expect(response.body.data.model).to.equal(validEquipment.model);
            expect(response.body.data.location).to.equal(validEquipment.location);
        });

        it('Создание оборудования с невалидным токеном, ожидается 401', async () => {
            let response = await request
                .post(`/xx-api/v1/equipments`)
                .set({"Authorization-Header-Custom": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOjEsImxvZ2luIjoiOGY3MDBlZTE1NzYwODk1NWJjNTRkMTRiMjJhNzBjY2VjZWNmOTQ2NDFhYjBmMzM2YTc1ZDIwMmI0MzY4ZDJjZCIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE1NzU4MDAzMTcsImV4cCI6MTU3NTg4NjcxN30.oHqJWIfLKLecGzHbJVQMuzqxE_tgzN78Rybx7bqkRFM"})
                .send(validEquipment);
            expect(response).to.have.status(401);
        });

        it('Создание оборудования с невалидными данными, ожидается 400', async () => {
            let response = await request
                .post(`/xx-api/v1/equipments`)
                .set({"Authorization-Header-Custom": adminToken})
                .send(invalidEquipment);
            expect(response).to.have.status(400);
        });
    });

    describe('Read equipment', async () => {
        it('Получение списка оборудования, ожидается 200', async () => {
            let response = await request
                .get(`/xx-api/v1/equipments`)
                .set({"Authorization-Header-Custom": adminToken})
            expect(response).to.have.status(200);
        });

        it('Получение оборудования по id, ожидается 200', async () => {
            let response = await request
                .get(`/xx-api/v1/equipments?filter=id%20eq%20${equipmentId}`)
                .set({"Authorization-Header-Custom": adminToken})
            expect(response).to.have.status(200);
        });

        it('Получение оборудования с невалидным токеном, ожидается 401', async () => {
            let response = await request
                .get(`/xx-api/v1/equipments?filter=id%20eq%20${equipmentId}`)
                .set({"Authorization-Header-Custom": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOjEsImxvZ2luIjoiOGY3MDBlZTE1NzYwODk1NWJjNTRkMTRiMjJhNzBjY2VjZWNmOTQ2NDFhYjBmMzM2YTc1ZDIwMmI0MzY4ZDJjZCIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE1NzU4MDAzMTcsImV4cCI6MTU3NTg4NjcxN30.oHqJWIfLKLecGzHbJVQMuzqxE_tgzN78Rybx7bqkRFM"})
            expect(response).to.have.status(401);
        });

        it('Получение несуществующего оборудования, ожидается пустой массив items', async () => {
            let response = await request
                .get(`/xx-api/v1/equipments?filter=id%20eq%201488`)
                .set({"Authorization-Header-Custom": adminToken});
            expect(response).to.have.status(200);
            expect(response.body.data.items.length).to.equal(0);
        });
    });

    describe('Update equipment', async () => {
        it('Редактирование оборудования с токеном админа, ожидается 200', async () => {
            let response = await request
                .put(`/xx-api/v1/equipments/${equipmentId}`)
                .set({"Authorization-Header-Custom": adminToken})
                .send(updatedEquipment);
            expect(response).to.have.status(200);
            expect(response.body.data.systemType).to.equal(updatedEquipment.systemType);
            expect(response.body.data.brand).to.equal(updatedEquipment.brand);
            expect(response.body.data.model).to.equal(updatedEquipment.model);
            expect(response.body.data.location).to.equal(updatedEquipment.location);
        });

        it('Редактирование оборудования с невалидным токеном, ожидается 401', async () => {
            let response = await request
                .put(`/xx-api/v1/equipments/${equipmentId}`)
                .set({"Authorization-Header-Custom": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOjEsImxvZ2luIjoiOGY3MDBlZTE1NzYwODk1NWJjNTRkMTRiMjJhNzBjY2VjZWNmOTQ2NDFhYjBmMzM2YTc1ZDIwMmI0MzY4ZDJjZCIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE1NzU4MDAzMTcsImV4cCI6MTU3NTg4NjcxN30.oHqJWIfLKLecGzHbJVQMuzqxE_tgzN78Rybx7bqkRFM"})
                .send(updatedEquipment);
            expect(response).to.have.status(401);
        });

        it('Редактирование несуществующего оборудования, ожидается 400', async () => {
            let response = await request
                .put(`/xx-api/v1/equipments/123123`)
                .set({"Authorization-Header-Custom": adminToken})
                .send(updatedEquipment);
            expect(response).to.have.status(400);
        });

        it('Редактирование с передачей некорректных данных, ожидается 400', async () => {
            let response = await request
                .put(`/xx-api/v1/equipments/${equipmentId}`)
                .set({"Authorization-Header-Custom": adminToken})
                .send(invalidEquipment);
            expect(response).to.have.status(400);
        });
    });

    describe('Delete equipment', async () => {
        it('Удаление оборудования с невалидным токеном, ожидается 401', async () => {
            let response = await request
                .delete(`/xx-api/v1/equipments/${equipmentId}`)
                .set({"Authorization-Header-Custom": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOjEsImxvZ2luIjoiOGY3MDBlZTE1NzYwODk1NWJjNTRkMTRiMjJhNzBjY2VjZWNmOTQ2NDFhYjBmMzM2YTc1ZDIwMmI0MzY4ZDJjZCIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE1NzU4MDAzMTcsImV4cCI6MTU3NTg4NjcxN30.oHqJWIfLKLecGzHbJVQMuzqxE_tgzN78Rybx7bqkRFM"})
            expect(response).to.have.status(401);
        });

        it('Удаление оборудования, ожидается 200', async () => {
            let response = await request
                .delete(`/xx-api/v1/equipments/${equipmentId}`)
                .set({"Authorization-Header-Custom": adminToken});
            expect(response).to.have.status(200);
        });

        it('Удаление без передачи ID, ожидается 404', async () => {
            let response = await request
                .delete(`/xx-api/v1/equipments/`)
                .set({"Authorization-Header-Custom": adminToken});
            expect(response).to.have.status(404);
        });
    });
});
