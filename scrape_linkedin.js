const puppeteer = require("puppeteer");
require("dotenv").config();

let scrape = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto("https://linkedin.com");
  console.log("go to linkedin.com success");

  await page
    .locator("#session_key")
    .setTimeout(5000)
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
  await page.goto("https://www.linkedin.com/in/umar-izzuddin/");

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

  await page.goto(
    "https://www.linkedin.com/in/umar-izzuddin/details/experience/"
  );

  await page.waitForTimeout(3000);

  const profileExperiences = await page.evaluate(async () => {
    const experiences = [];

    const experienceElements = document.querySelectorAll(".artdeco-list__item");

    const experienceLength = experienceElements.length;

    for (let i = 0; i < experienceLength; i++) {
      experiences.push(
        experienceElements[i].children[0].children[0].children[1].querySelector(
          "span[aria-hidden='true']"
        ).textContent
      );
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
