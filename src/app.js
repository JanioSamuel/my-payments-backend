const pup = require('puppeteer');

//module.exports = {

async function start() {
  let partialData = [];
  let refinedData = [];
  const browser = await pup.launch();
  const page = await browser.newPage();
  await page.goto('http://easysystem.com.br/emw/login.asp?ic=20');

  await page.select('#filial', 'SAO PAULO');
  await page.$eval('#usiario', el => el.value = '41437989802');
  await page.$eval('#senha', el => el.value = '$0n53R1n4');
  const enterButton = await page.$('.loginBtEntrar')
  await Promise.all([
    await enterButton.click(),
    page.waitForNavigation(),
  ])

  await page.goto('http://easysystem.com.br/emw/system/fichacoop/folhas_pagto.asp?id=00010701');
  await page.waitFor('table', { timeout: 3000 }).catch(() => console.log('timeout'));
  partialData = await page.$$eval('table tbody tr td table tbody tr td table tbody tr td table', values => values.map(value => value.innerText));

  removeUnecessaryInfo(partialData, refinedData);
  browser.close();
  console.log(await createObject(refinedData));
}

function removeUnecessaryInfo(partialData, refinedData) {
  partialData = partialData.filter((entry) => { return entry.trim() != ''; });
  partialData.forEach(element => {
    element = element.replace('\n\t', '').replace('\t', '').replace('\n', '');
    element = element.replace('Legenda:Visualizar DetalhesImprimir Demonstrativo', '');
    element = element.replace('Registros encontrados:10', '');
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
  start
}
//}
