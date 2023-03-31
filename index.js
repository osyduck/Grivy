const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const delay = require('delay');
const fs = require('fs');
const fetch = require('node-fetch');
const config = require('./config.json');

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

    // console.log(gasken)
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

    if (gaskenCuy.error?.message == 'wrong_data') {
        return {
            success: false,
            message: 'already_claimed'
        };
    } else if(gaskenCuy.error?.message == 'no_available_coupons') {
        return {
            success: false,
            message: 'no_available_coupons'
        };
    } else {
        const code = gaskenCuy.result.code;

        return {
            success: true,
            code
        };
    }


}

async function gas(email, password, index) {
    try {
        fs.rmSync(`session/${index}`, { recursive: true });
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
            userDataDir: `session/${index}`,
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

        await page.setRequestInterception(true);
        let bearer;
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
                log(`[${date()}] ${colors.green("Button Clicked")}`);
                await delay(1000);
            } catch (error) {

            }
        } while (isClicked == false);


        await page.waitForTimeout(2000);
        await page.waitForSelector('.social-account-label')
        await page.evaluate(() => {
            document.querySelectorAll('.social-account-label')[0].click()
        })

        const newPagePromise = new Promise(x => browser.once('targetcreated', target => x(target.page())));
        const newPage = await newPagePromise;

        log(`[${date()}] ${colors.green("Gmail Login in Progress...")}`);

        await newPage.waitForTimeout(2000);
        await newPage.waitForSelector('input[type=email]', { visible: true });
        await newPage.click('input[type=email]');
        await newPage.type('input[type=email]', email, { delay: 30 });
        await newPage.click('#identifierNext > div > button > div.VfPpkd-RLmnJb');


        await newPage.waitForTimeout(5000);

        await newPage.waitForSelector('input[type=password]', { visible: true });
        await newPage.type('input[type=password]', password);

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

        log(`[${date()}] Token: ${bearer}`);

        const claimS = await claim(bearer);

        await browser.close();
        try {
            fs.rmSync(`session/${index}`, { recursive: true, force: true });
        } catch (error) {

        }

        if (claimS.success) {
            log(`[${date()}] ${colors.green("Claim Success")}`);
            log(`[${date()}] ${colors.green("Code: " + claimS.code)}`);
            return claimS;
        } else {
            log(`[${date()}] ${colors.red("Claim Failed")}`);
            log(`[${date()}] ${colors.red("Reason: " + claimS.message)}`);
            return claimS;
        }
    } catch (error) {
        log(`[${date()}] ${colors.red(error.message)}`);
        // await browser.close();
        try {
            fs.rmSync(`session/${index}`, { recursive: true, force: true });
        } catch (error) {

        }
        return {
            success: false,
            message: error.message
        };
    }



};

(async () => {
    const deleteFirstIndex = () => {
        let empassPath = "./empass.txt";
        let accountList = fs.readFileSync(empassPath, "utf-8").replace("\r").split("\n");
        accountList.shift();
        return fs.writeFileSync(empassPath, accountList.join("\n"), "utf-8");
    }

    const writeSuccess = (accounts) => {
        const empassPath = "./success-empass.txt";
        return fs.writeFileSync(empassPath, accounts.join("\n"), "utf-8");
    }
    
    const writeFail = (accounts) => {
        const empassPath = "./fail-empass.txt";
        return fs.writeFileSync(empassPath, accounts.join("\n"), "utf-8");
    }
    
    const replace = (accounts) => {
        const empassPath = "./empass.txt";
        return fs.writeFileSync(empassPath, accounts.join("\n"), "utf-8");
    }

    console.clear();
    log(colors.bgCyan("Frestea") + " " + colors.bgBlue("@osyduck"));
    log();

    let empass = fs.readFileSync(config.empass, "utf-8");

    let empassS = empass.split("\r\n");
    let numList = empassS.length;
    let thread = config.thread;
    let result = [];
 
    for (let i = 0; i < Math.floor(numList / thread); i++) {
        log(`[${date()}] ${colors.yellow(`Processing ${i + 1} of ${Math.floor(numList / thread)} List`)}`);

        let spl = empassS.splice(0, thread);

        // console.log(spl)
        let promises = spl.map(async (item, index) => {
            let email = item.split("|")[0];
            let pass = config.password;

            let result = await gas(email, pass, index.toString());
            if (result.success == true) {
                deleteFirstIndex();
                fs.appendFileSync('code.txt', result.code + "\n");
                return {
                    success: true,
                    email,
                    pass,
                    empass: item,
                    index
                };
            } else {
                deleteFirstIndex();
                return {
                    success: false,
                    email,
                    pass,
                    empass: item,
                    index
                };
            }

            log();
        });

        const res = await Promise.all(promises);
        result.push(...res);
    }
    
    const resSuccess = [];
    const resFail = [];

    result.forEach((r) => {
        if (r.success) resSuccess.push(r.empass);
        else resFail.push(r.empass);
    });

    writeSuccess(resSuccess);
    writeFail(resFail);
    replace(resFail);
})()
