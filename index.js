const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const delay = require('delay');
const fs = require('fs');
const fetch = require('node-fetch');
// const fetch = require('node-fetch');
// const readline = require('readline-sync');

const date = () => new Date().toLocaleTimeString({ timeZone: 'Asia/Jakarta' });
const log = console.log;
const colors = require("colors");


async function claim(bearer) {
    let data = JSON.stringify({
        "data": {
            "publicCode": "sat-ft-ram-120",
            "gaCid": null,
            "cdsPixelId": "",
            "latitude": null,
            "longitude": null,
            "recaptcha_token": null,
            "country": null,
            "city": null,
            "ip": null,
            "domain": "freshbreak_frestea"
        }
    });

    const gasken = await fetch("https://us-central1-grivy-barcode.cloudfunctions.net/grabCoupon", {

        headers: {
            'authority': 'us-central1-grivy-barcode.cloudfunctions.net',
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.9',
            'authorization': 'Bearer ' + bearer,
            'content-type': 'application/json',
            'origin': 'https://freshbreak.frestea.co.id',
            'referer': 'https://freshbreak.frestea.co.id/',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36'
        },
        body: data,
        method: 'POST'
    }).then(res => res.json());

    console.log(gasken)
    const couponId = gasken.result.id;

    let claimData = JSON.stringify({ "data": { "coupon": { "id": `${couponId}`, "code": null, "status": "grabbed", "opened_expire_in": { "days": 7, "hours": 22, "minutes": 0, "seconds": 1 }, "claimed_expire_in": null, "claim_approved": null, "claim_approve_status": null, "claim_approval_message": null, "just_grabbed": true, "transacted_claim": null, "destination_url": null, "cashback_status": null, "cashback_amount": null, "cashback_status_change_at": null, "receipt_id": null }, "terms_conditions_01": true, "terms_conditions_02": false, "terms_conditions_03": false, "latitude": null, "longitude": null, "childBirthday": null, "userFirstName": null, "userLastName": null, "phonePopup": null, "recaptcha_token": null, "domain": "freshbreak_frestea" } });

    const gaskenCuy = await fetch("https://us-central1-grivy-barcode.cloudfunctions.net/claimCoupon", {

        headers: {
            'authority': 'us-central1-grivy-barcode.cloudfunctions.net',
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.9',
            'authorization': 'Bearer ' + bearer,
            'content-type': 'application/json',
            'origin': 'https://freshbreak.frestea.co.id',
            'referer': 'https://freshbreak.frestea.co.id/',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36'
        },
        body: claimData,
        method: 'POST'
    }).then(res => res.json());


    console.log(gaskenCuy)

    if (gaskenCuy.error?.message == 'wrong_data') {
        return "already_claimed"
    } else {
        const code = gaskenCuy.result.code;

        fs.appendFileSync('code.txt', code + "\n");

        return code;
    }


}

async function gas(email, password, index) {
    try {
        fs.rmSync(index, { recursive: true });
    } catch (error) {
        // console.log(error.message)
    }
    let browser;
    try {
        const options = {
            waitUntil: 'networkidle0',
            timeout: 0
        }
        browser = await puppeteer.launch({
            headless: false,
            userDataDir: index,
            defaultViewport: null,
            args: [
                '--disable-notifications',
                '--disable-features=site-per-process',
                '--no-sandbox',
            ]
        })

        const context = browser.defaultBrowserContext();
        await context.overridePermissions('https://freshbreak.frestea.co.id/', ['geolocation']);

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36');
        await page.setGeolocation({ latitude: -6.589828, longitude: 110.6764994 });
        //page.setViewport({ width: 1920, height: 1080 });


        await page.setRequestInterception(true);
        let bearer;
        let campaign;
        page.on('request', request => {
            if (request.resourceType() == 'stylesheet' || request.resourceType() == 'font' || request.resourceType() == 'image') {
                request.continue();
            } else {
                if (request.url().includes('getUserIdEncrypted') && request.method() == "POST") {
                    bearer = request.headers().authorization.split("Bearer ")[1]
                    request.continue();
                } else {
                    request.continue();
                }
            }

        });

        page.on('response', async response => {
            const request = response.request();

            if (request.url().includes('cloudfunctions.net/getCampaign') && request.method() == "POST") {
                const data = await response.json();
                campaign = data;
                // console.log(data)
            }
        });

        log(`[${date()}] Login with Gmail ${email}`)

        await page.goto('https://freshbreak.frestea.co.id/login', options)

        await page.waitForSelector('#mat-dialog-0 > app-cookie-management > div > div.confirm-content > div:nth-child(2) > button > span.mat-button-wrapper', { visible: true, timeout: 60000 });
        await page.waitForTimeout(2000);
        let isClicked = false;
        do {
            try {
                await page.click('#mat-dialog-0 > app-cookie-management > div > div.confirm-content > div:nth-child(2) > button > span.mat-button-wrapper');
                isClicked = true;
                log("CLICKED")
                await delay(1000);
            } catch (error) {

            }
        } while (isClicked == false);


        await page.waitForTimeout(2000);
        // // await page.waitForNavigation();
        // await page.click('body > app-root > div > app-campaign > div > div.bottom-box > button');
        await page.waitForSelector('.social-account-label')
        await page.evaluate(() => {
            document.querySelectorAll('.social-account-label')[0].click()
        })

        const newPagePromise = new Promise(x => browser.once('targetcreated', target => x(target.page())));
        const newPage = await newPagePromise;

        await newPage.waitForTimeout(2000);
        await newPage.waitForSelector('input[type=email]', { visible: true });
        await newPage.click('input[type=email]');
        await newPage.type('input[type=email]', email, { delay: 30 });
        await newPage.click('#identifierNext > div > button > div.VfPpkd-RLmnJb');


        await newPage.waitForTimeout(5000);

        await newPage.waitForSelector('input[type=password]', { visible: true });
        await newPage.type('input[type=password]', password);

        //await newPage.waitForSelector('#passwordNext > div > button > div.VfPpkd-RLmnJb', { visible: true });
        await newPage.click('#passwordNext > div > button > div.VfPpkd-RLmnJb');

        try {
            await newPage.waitForSelector('#accept', { visible: true, timeout: 10000 })
            await newPage.click('#accept');
        } catch (error) {
            try {
                await newPage.click('#confirm')
            } catch (error) {

            }
        }
        do {
            if (bearer) {
                break;
            } else {
                await delay(2000)
            }
        } while (bearer == null);


        log(`[${date()}] ${colors.green("Logged In Successfully")}`);

        log(bearer);

        claim(bearer);


        // await page.waitForSelector('#mat-dialog-1 > app-permission-dialog > div > div.permission-action > button.mat-focus-indicator.btn-full-width.btn-cancel.mat-raised-button.mat-button-base');
        // await page.click('#mat-dialog-1 > app-permission-dialog > div > div.permission-action > button.mat-focus-indicator.btn-full-width.btn-cancel.mat-raised-button.mat-button-base');

        // await delay(3000);
        // //await page.waitForSelector('#mat-dialog-0 > app-cookie-management > div > div.confirm-content > div:nth-child(2) > button > span.mat-button-wrapper', { visible: true, timeout: 15000 });
        // await page.click('#mat-dialog-0 > app-cookie-management > div > div.confirm-content > div:nth-child(2) > button > span.mat-button-wrapper');

        // await delay(5000);
        // //await page.waitForSelector('body > app-root > div > app-campaign > div > div.bottom-box > button', { visible: true, timeout: 15000 });
        // await page.click('body > app-root > div > app-campaign > div > div.bottom-box > button')

        // await delay(5000);
        // //await page.waitForSelector('body > app-root > div > app-campaign > section > div > div.campaign-footer.ng-star-inserted > button > span.mat-button-wrapper', { visible: true, timeout: 15000 });
        // await page.click('body > app-root > div > app-campaign > section > div > div.campaign-footer.ng-star-inserted > button > span.mat-button-wrapper');

        // await delay(2000);

        // try {
        //     await page.click('#mat-dialog-0 > app-redeem-checkbox-dialog > div > div:nth-child(2) > label > span.checkmark');
        // } catch (error) {

        // }


        // log(`[${date()}] Claiming Coupon`)

        // try {
        //     await page.click('#mat-dialog-0 > app-redeem-checkbox-dialog > div > div:nth-child(3) > button');
        //     await page.waitForSelector('#mat-dialog-2 > app-bar-code > div > div.mat-dialog-content > app-code > div', { visible: true, timeout: 7000 });
        // } catch (error) {

        // }




        // try {
        //     await page.click('#mat-dialog-0 > app-bar-code > div > div.mat-dialog-content > app-code > div > div:nth-child(3) > div > app-barcode > div > div');
        // } catch (error) {
        //     await page.click('#mat-dialog-2 > app-bar-code > div > div.mat-dialog-content > app-code > div > div:nth-child(3) > div > app-barcode');
        // }


        // await delay(3000)
        // log(`[${date()}] Taking Screenshot & Saving to Image`);
        // let text; 
        // try {
        //     const element = await page.$('#mat-dialog-1 > app-full-screen-code-dialog > div > div.flex-container > div > app-code > div');

        //     const elements = await page.$("#mat-dialog-1 > app-full-screen-code-dialog > div > div.flex-container > div > app-code > div > div.code-wrapper > div > app-barcode > div > p");
        //     text = await page.evaluate(element => element.textContent, elements);


        //     await element.screenshot({ path: `./screenshot/${text}.png` });

        // } catch (error) {
        //     //#mat-dialog-3 > app-full-screen-code-dialog > div > div.flex-container > div > app-code > div > div.code-wrapper > div > app-barcode > div > p
        //     const element = await page.$('#mat-dialog-3 > app-full-screen-code-dialog > div > div.flex-container > div > app-code > div');

        //     const elements = await page.$("#mat-dialog-3 > app-full-screen-code-dialog > div > div.flex-container > div > app-code > div > div.code-wrapper > div > app-barcode > div > p");
        //     text = await page.evaluate(element => element.textContent, elements);


        //     await element.screenshot({ path: `./screenshot/${text}.png` });

        // }
        // //await page.waitForSelector('#mat-dialog-5 > app-full-screen-code-dialog > div > div.flex-container > div > app-code');
        // log(`[${date()}] ${colors.green("Successfully Claimed " + text)}`);
        await browser.close();
        try {
            fs.rmSync(index, { recursive: true, force: true });
        } catch (error) {

        }
        return true;
    } catch (error) {
        log(`[${date()}] ${colors.red(error.message)}`)
        console.log(error)
        // await browser.close();
        try {
            fs.rmSync(index, { recursive: true, force: true });
        } catch (error) {

        }
        return false;
    }



};

(async () => {
    const deleteFirstIndex = () => {
        let empassPath = "./empass.txt";
        let accountList = fs.readFileSync(empassPath, "utf-8").replace("\r").split("\n");
        accountList.shift();
        return fs.writeFileSync(empassPath, accountList.join("\n"), "utf-8");
    }

    console.clear();
    log(colors.bgCyan("Coca Cola") + " " + colors.bgBlue("@osyduck"));
    log();

    let empass = fs.readFileSync("empass.txt", "utf-8");

    let empassS = empass.split("\r\n");
    let numList = empassS.length;
    let thread = 5;

    // console.log(empassS.splice(0, 1))
    for (let i = 0; i < Math.floor(numList / thread); i++) {

        log(`[${date()}] ${colors.yellow(`Processing ${i + 1} of ${numList / thread} List`)}`);

        // let email = empassS[i].split("|")[0];
        // let pass = "AnjayMabar132";

        // let result = await gas(email, pass, "1");
        // if (result == true) {
        //     deleteFirstIndex();
        // } else {
        //     return;
        // }

        let spl = empassS.splice(0, thread);

        console.log(spl)
        let promises = spl.map(async (item, index) => {
            let email = item.split("|")[0];
            let pass = "AnjayMabar132";

            let result = await gas(email, pass, index.toString());

            if (result == true) {
                deleteFirstIndex();
            } else {
                return;
            }

            log();
        });

        await Promise.all(promises);

        // let email = empass[i].split("|")[0];
        // // let pass = empass[i].split("|")[1];
        // let pass = "AnjayMabar132";

        // let result = await gas(email, pass);

        // if (result == true) {
        //     deleteFirstIndex();
        // } else {
        //     continue;
        // }

        // log();


    }



})()