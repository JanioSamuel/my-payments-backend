const pup = require('puppeteer');
const dotenv = require('dotenv');

async function index(req, res) {
  dotenv.config();
  const LOGIN = req.body.login;
  const PASSWORD = req.body.password;
  let partialData = [];
  let refinedData = [];
  const browser = await pup.launch();
  const page = await browser.newPage();
  await page.goto(process.env.LOGIN_PAGE);

  await doLogin(page, LOGIN, PASSWORD);

  await page.goto(`${process.env.PAYMENTS_PAGE}${req.body.id}`);
  await page.waitFor('table', { timeout: 3000 }).catch(() => console.log('timeout'));
  partialData = await page.$$eval('table tbody tr td table tbody tr td table tbody tr td table', values => values.map(value => value.innerText));

  console.log('Removing unnecessary info');
  removeUnnecessaryInfo(partialData, refinedData);
  browser.close();
  console.log('Creating object');
  const response = await createObject(refinedData);
  console.log('Returning response');
  return res.json(response);
}

async function doLogin(page, LOGIN, PASSWORD) {
  await page.select('#filial', 'SAO PAULO');
  await page.$eval('#usiario', (el, user) => el.value = user, LOGIN);
  await page.$eval('#senha', (el, pass) => el.value = pass, PASSWORD);
  const enterButton = await page.$('.loginBtEntrar');
  await Promise.all([
    await enterButton.click(),
    page.waitForNavigation(),
  ]);
}

async function removeUnnecessaryInfo(partialData, refinedData) {
  partialData = partialData.filter((entry) => { return entry.trim() != ''; });
  partialData.forEach(element => {
    element = element.replace('\n\t', '').replace('\t', '').replace('\n', '');
    element = element.replace('Legenda:Visualizar DetalhesImprimir Demonstrativo', '');
    element = element.replace('Registros encontrados:\d+', '');
    element = element.replace('\n\t\n\t', '');
    if (element.trim() != '') {
      refinedData.push(element);
    }
  });
  return refinedData;
}

async function createObject(data) {
  const nameObjects = ['month', 'id', 'grossValue', 'netValue', 'paymentStatus', 'paymentDate'];
  let objects = [];
  let newObject = {};
  let count = 0;
  for (let i = 0; i < data.length; i++) {
    newObject[nameObjects[count]] = data[i];
    if (count === 5) {
      objects.push(newObject);
      newObject = new Object();
      count = -1;
    }
    count++;
  }
  return objects;
}

module.exports = {
  index
}

