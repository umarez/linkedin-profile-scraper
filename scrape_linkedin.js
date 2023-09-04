const puppeteer = require("puppeteer");
require("dotenv").config();

let scrape = async () => {
  const URL = "https://linkedin.com";

  const browser = await puppeteer.launch({
    userDataDir: "./user_data",
  });
  const page = await browser.newPage();

  await page.goto(URL);
  console.log("go to linkedin.com success");
  try {
    await page
      .locator("#session_key")
      .setTimeout(3000)
      .fill(process.env.LINKEDIN_LOGIN_EMAIL);

    await page.waitForTimeout(2000);
    await page
      .locator("#session_password")
      .fill(process.env.LINKEDIN_LOGIN_PASSWORD);
    await page.waitForTimeout(2000);
    const loginButton = await page.waitForSelector(
      '[data-id="sign-in-form__submit-btn"]',
      {
        timeout: 5000,
      }
    );
    loginButton.click();
    console.log("Signin In...");
    await page.waitForTimeout(5000);
    console.log("login success!");
  } catch (err) {
    console.log("already login")
  }

  await page.goto(`${URL}/in/umar-izzuddin/`);

  console.log("go to profile success");
  await page.waitForTimeout(3000);
  console.log("getting profile data...");

  const profileName = await page.evaluate(async () => {
    let name = "";
    const regex = /\)(.*?)\|/;

    const nameElement = document.querySelector("title").innerText;

    const match = nameElement.match(regex);

    if (match) {
      const truncatedText = match[1].trim(); // Extracted text and remove leading/trailing spaces
      console.log(truncatedText);
      name = truncatedText;
    }
    return name;
  });

  console.log("getting profile experiences...");

  await page.goto(`${URL}/in/umar-izzuddin/details/experience/`);

  await page.waitForTimeout(3000);

  const profileExperiences = await page.evaluate(async () => {
    const experiences = [];

    const experienceElements = document.querySelectorAll(".artdeco-list__item");

    const experienceLength = experienceElements.length;

    for (let i = 0; i < experienceLength; i++) {
      const exp = {};
      const blockContent = experienceElements[
        i
      ].children[0].children[0].children[1].querySelectorAll(
        "span[aria-hidden='true']"
      );

      exp.title = blockContent[0].textContent;
      exp.company = blockContent[1].textContent.split("·")[0];
      exp.position = blockContent[1].textContent.split("·")[1];
      exp.period = blockContent[2].textContent;

      experiences.push(exp);
    }

    return experiences;
  });

  browser.close();
  await page.waitForTimeout(5000);
  console.log("scraping profile data success!");

  return {
    name: profileName,
    experience: profileExperiences,
  };
};

scrape().then((value) => {
  console.log(value);
});
