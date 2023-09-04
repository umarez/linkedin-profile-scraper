const puppeteer = require("puppeteer");
const readline = require("readline-sync");
require("dotenv").config();

let scrape = async () => {
  const URL = "https://linkedin.com";

  const linkedinUsername = readline.question("Enter your linkedin username: ");

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
    console.log("already login");
  }

  await page.goto(`${URL}/in/${linkedinUsername}/`);

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

  await page.goto(`${URL}/in/${linkedinUsername}/details/experience/`);

  await page.waitForTimeout(3000);

  const profileExperiences = await page.evaluate(async () => {
    const experiences = [];

    const experienceElements = document.querySelectorAll(".artdeco-list__item");

    const experienceLength = experienceElements.length;

    for (let i = 0; i < experienceLength; i++) {
      let exp = {};

      try {
        const title = experienceElements[
          i
        ].children[0].children[0].children[1].children[0].querySelectorAll(
          "span[aria-hidden='true']"
        );

        exp.company = title[0].textContent;
        exp.duration = title[1].textContent;

        exp.positions = [];

        const positionElements = experienceElements[
          i
        ].children[0].children[0].children[1].children[1]
          .querySelector("ul > li")
          .children[0].querySelectorAll("a");

        for (let i = 0; i < positionElements.length; i++) {
          if (!positionElements[i].href?.includes("company")) {
            continue;
          }
          const position = {};
          const positionTitle = positionElements[i].querySelectorAll(
            "span[aria-hidden='true']"
          );
          position.title = positionTitle[0].textContent;
          position.duration = positionTitle[1].textContent;
          exp.positions.push(position);
        }
        if (exp.positions.length === 0) {
          throw new Error("No position found");
        }

        experiences.push(exp);
      } catch (err) {
        exp = {};

        const blockContent = experienceElements[
          i
        ].children[0].children[0].children[1].querySelectorAll(
          "span[aria-hidden='true']"
        );

        exp.title = blockContent[0].textContent;
        exp.company = blockContent[1].textContent.split("·")[0];
        exp.position = blockContent[1].textContent.split("·")[1];
        exp.period = blockContent[2].textContent.split("·")[0];
        exp.duration = blockContent[2].textContent.split("·")[1];

        experiences.push(exp);
      }
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
  console.log(JSON.stringify(value));
});
