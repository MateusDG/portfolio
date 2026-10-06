# Mateus Diniz — Portfólio

Portfólio estático em português, com visual pixelado baseado na referência solicitada, projetos reais, detalhes do BanVic e do TCC, mapa em blocos e terminal de contato.

## Executar

Requer Node.js. Não há dependências de runtime ou instalação necessária.

```sh
npm run dev
```

Abra `http://127.0.0.1:4173`. Para verificar a sintaxe, execute `npm run check`.

## Conteúdo e manutenção

- `dist/index.html`: apresentação, projetos, perfil e contatos.
- `dist/styles.css`: tipografia Silkscreen, responsividade e animações.
- `dist/app.js`: detalhes dos projetos, filtros, terminal, gráficos e interações.
- `dist/motion.js` e `dist/motion.css`: abertura, cidades e redes animadas, parallax, construção dos gráficos e controle de movimento.
- `dist/assets/`: fontes locais, dados públicos e captura do dashboard.
- `.openai/hosting.json`: identidade do Site e pasta publicada.

Todos os arquivos em `dist/` podem ser publicados em uma hospedagem estática. O portfólio não exige banco, chaves de API ou serviços de analytics.

O gráfico do GitHub usa um **snapshot público real**, com a data de coleta exibida na página. Para atualizá-lo, execute `python scripts/sync-public-data.py` e publique novamente. Ele não afirma atualização em tempo real. O total de contribuições é o informado pelo GitHub; as alturas representam o nível diário de atividade do calendário público.

O mapa mostra a origem profissional de Mateus. Não representa visitantes nem coleta localização. Sua geometria deriva de Natural Earth, em domínio público; `python scripts/generate-world.py` regenera os blocos.

## Origem das informações

- Nome, contatos, formação e experiência: currículo e histórico profissional disponíveis no workspace.
- BanVic: README e revisão de requisitos de 05/10/2026 do projeto `data-engineer-indicium`.
- TCC: documentação e panorama de 15/09/2026 do projeto `recommendation_fuzzy`; estágio acadêmico informado como em andamento.
- Repositórios e contribuições: perfil público [MateusDG](https://github.com/MateusDG).
- Captura real do BanVic: evidência pública do dashboard comercial, otimizada em WebP.

O protótipo acadêmico do TCC e o MVP público `saas-fuzzy` são projetos distintos; a página explicita essa relação. As ilustrações em canvas e o avatar em SVG são composições originais ilustrativas.

## Interações e acessibilidade

Menu móvel, filtros, modais com foco e fechamento por Escape, terminal com comandos locais, cópia do e-mail, links reais, atalhos de teclado e respeito à preferência por movimento reduzido. O terminal apresenta links para contato; nenhum comando envia mensagens automaticamente.

As cenas compartilham um único loop de animação, limitado a aproximadamente 30 quadros por segundo. As cenas fora da tela, a aba em segundo plano e o conteúdo atrás de um modal não ficam animando. O botão **Movimento on/off** pausa a camada de animação e preserva a preferência neste navegador; a preferência do sistema por movimento reduzido é respeitada automaticamente.

O cenário de abertura pode ser reconstruído ao clicar nele. O personagem salta ao ser acionado e aceita as setas quando recebe foco. O gráfico de contribuições alterna entre 3D e 2D, pode ser reconstruído e permite explorar datas com as setas. A animação não altera os valores históricos do GitHub.

Referência visual: [Samuel Rizzon](https://www.samuelrizzon.dev/). Fontes: Silkscreen, por Jason Kottke, distribuída sob SIL Open Font License; licença em `dist/assets/OFL.txt`.
