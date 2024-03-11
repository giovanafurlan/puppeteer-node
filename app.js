const express = require("express");
const puppeteer = require("puppeteer-core");
require("dotenv").config();

const app = express();
const port = 3001;

// Rota para fazer a chamada de API
app.get("/api", async (req, res) => {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
      "--disable-features=site-per-process",
    ],
    executablePath: puppeteer.executablePath(),
  });
  try {
    const parametro = req.query.parametro;

    if (!parametro) {
      return res.status(400).json({ error: "Parâmetro não fornecido" });
    }

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(parametro, { waitUntil: "networkidle2", timeout: 60000 }); // aumentando para 60 segundos (60000 milissegundos)

    let sobre;
    let funcao;
    let localizacao;
    let experiencias;

    // pegar título
    const title = await page.title();

    if (title == "Sign Up | LinkedIn") {
      // clica no link de login
      await page.click("a.main__sign-in-link");

      // preencher o campo de e-mail
      await page.type(
        'input[name="session_key"]',
        "backupgiovanafurlan@outlook.com"
      );

      // preencher o campo de senha
      await page.type('input[name="session_password"]', "Fur0412*");

      // clicar no botão de login
      await page.click('button[aria-label="Sign in"]');

      // aguardar um pouco para permitir que a página seja carregada completamente após o login
      await page.waitForTimeout(5000); // Ajuste o tempo conforme necessário

      // redirecionar para a página do perfil
      await page.goto("https://www.linkedin.com/in/giovana-furlan/");
    } else {
      // pegar conteúdo sobre
      sobre = await page.evaluate(() => {
        const span = document.querySelector(".core-section-container__content");
        if (span) {
          return span.textContent.trim();
        }
        return null;
      });

      // pegar conteúdo função
      funcao = await page.evaluate(() => {
        const span = document.querySelector(".top-card-layout__headline");
        if (span) {
          return span.textContent.trim();
        }
        return null;
      });

      // pegar conteúdo localização
      localizacao = await page.evaluate(() => {
        const span = document.querySelector(
          "div.not-first-middot span:first-child"
        );
        if (span) {
          return span.textContent.trim();
        }
        return null;
      });

      // pegar conteúdo experiências
      experiencias = await page.evaluate(() => {
        const experienceItems = document.querySelectorAll(
          'section[data-section="experience"] .experience-item'
        );
        const experiencesArray = [];

        experienceItems.forEach((item) => {
          const empresa = item
            .querySelector(".experience-item__subtitle")
            .textContent.trim();
          const duracao = item.querySelector(".date-range").textContent.trim();
          const localizacao = item
            .querySelectorAll(".experience-item__meta-item")[1]
            .textContent.trim();
          const descricao = item
            .querySelector(".show-more-less-text__text--less")
            .textContent.trim();

          experiencesArray.push({
            empresa,
            duracao,
            localizacao,
            descricao,
          });
        });

        return experiencesArray;
      });
    }

    // Retornando a resposta como JSON
    res.json({ title, sobre, funcao, localizacao, experiencias });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally {
    await browser.close();
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
