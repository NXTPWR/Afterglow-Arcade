const assert = require('node:assert/strict');

module.exports = async function runElectronSmoke({ app, window }) {
  const run = code => window.webContents.executeJavaScript(code, true);
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  async function waitFor(expression, label, timeout = 15000) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      if (await run('Boolean(' + expression + ')')) return;
      await sleep(100);
    }
    throw new Error('Timed out waiting for ' + label);
  }
  async function click(selector) {
    await waitFor('document.querySelector(' + JSON.stringify(selector) + ')', selector);
    await run('document.querySelector(' + JSON.stringify(selector) + ').click(); true');
  }
  async function backToFloor() {
    await click('#back');
    await waitFor('document.querySelector(\'[data-g="circle"]\')', 'game floor');
  }
  async function startGame(id) {
    await click('[data-g="' + id + '"]');
    await waitFor('document.querySelector(".modal")', id + ' round');
  }

  try {
    await waitFor('window.AfterglowCore', 'scoring engine');
    const saved = await run('JSON.parse(localStorage.getItem("scores")||"{}")');
    const ids = ['circle', 'krillion', 'perceptle', 'headcount', 'logos', 'contexto'];
    if (ids.every(id => Number.isFinite(saved[id]))) {
      const percentage = await run('AfterglowCore.gamerPercentage(JSON.parse(localStorage.getItem("scores")||"{}"),' + JSON.stringify(ids) + ')');
      assert.ok(Number.isFinite(percentage), 'Gamer Percentage should persist after relaunch');
      const historyLength = await run('(JSON.parse(localStorage.getItem("history")||"[]")).length');
      assert.ok(historyLength >= 6, 'game history should persist after relaunch');
      console.log('[QA] PASS: six saved scores and Gamer Percentage survive relaunch (' + percentage + '%).');
      app.quit();
      return;
    }

    assert.equal(await run('document.querySelectorAll("article.card[data-g]").length'), 6, 'dashboard should show all six games');

    // Perfect Circle: draw a complete, even circle and test the results replay control.
    await startGame('circle');
    await run(`(()=>{const c=document.querySelector('#c');c.setPointerCapture=()=>{};const cx=c.width/2,cy=c.height/2,r=Math.min(c.height*.31,c.width*.2);for(let i=0;i<=360;i++){const a=i*Math.PI/180,e={offsetX:cx+Math.cos(a)*r,offsetY:cy+Math.sin(a)*r,pointerId:1};if(i===0)c.onpointerdown(e);else c.onpointermove(e)}c.onpointerup({});document.querySelector('#submit').click();return true})()`);
    await waitFor('document.querySelector("#replay")', 'circle result');
    assert.equal(await run('JSON.parse(localStorage.getItem("scores")).circle'), 100, 'perfect circle should score 100');
    await click('#replay');
    await waitFor('document.querySelector("#c")', 'circle replay');
    await click('.close');
    await waitFor('document.querySelector(\'[data-g="circle"]\')', 'floor after replay close');

    // Krillion: finish seven real question screens; each response is recorded.
    await startGame('krillion');
    for (let i = 0; i < 7; i++) {
      await waitFor('document.querySelector(".choices button")', 'Krillion question ' + (i + 1));
      await run('document.querySelector(".choices button").click(); true');
    }
    await waitFor('document.querySelector("#replay")', 'Krillion results');
    await backToFloor();

    // Perceptle: complete count, tracking, angle, tempo, and split rounds.
    await startGame('perceptle');
    await waitFor('document.querySelector("#answer") && !document.querySelector("#answer").disabled', 'Perceptle count reveal', 5000);
    await run('document.querySelector("#answer").value="1";document.querySelector("#submit").click();true');
    await waitFor('document.querySelector("[data-n]")', 'Perceptle tracking choices', 10000);
    await run('document.querySelector("[data-n]").click();true');
    await waitFor('document.querySelector("#submit")', 'Perceptle angle');
    await run('document.querySelector("#submit").click();true');
    await waitFor('document.querySelector("#beat")', 'Perceptle tempo');
    await waitFor('document.querySelector("#beat") && document.querySelector("#beat").textContent.includes("YOUR TURN")', 'tempo playback', 12000);
    await run('for(let i=0;i<4;i++)document.querySelector("#tap").click();true');
    await waitFor('document.querySelector("#submit")', 'Perceptle split');
    await run('document.querySelector("#submit").click();true');
    await waitFor('document.querySelector("#replay")', 'Perceptle results');
    await backToFloor();

    // Head Count hides faces before enabling the response.
    await startGame('headcount');
    await waitFor('document.querySelector("#answer") && !document.querySelector("#answer").disabled', 'Head Count answer window', 6000);
    await run('document.querySelector("#answer").value="0";document.querySelector("#submit").click();true');
    await waitFor('document.querySelector("#replay")', 'Head Count results');
    await backToFloor();

    // Logo recall requires the study window to end before drawing is enabled.
    await startGame('logos');
    await waitFor('document.querySelector("#reveal") && !document.querySelector("#reveal").disabled', 'logo recall window', 6000);
    await run(`(()=>{const c=document.querySelector('#c');c.setPointerCapture=()=>{};c.onpointerdown({offsetX:80,offsetY:110,pointerId:1});for(let i=1;i<=20;i++)c.onpointermove({offsetX:80+i*12,offsetY:110+Math.sin(i/3)*35,pointerId:1});c.onpointerup({});document.querySelector('#reveal').click();return true})()`);
    await waitFor('document.querySelector("#replay")', 'logo recall results');
    await backToFloor();

    // Solve Contexto through its offline semantic neighborhoods.
    await startGame('contexto');
    await waitFor('document.querySelector("#word")', 'Contexto guesses');
    await run(`(()=>{for(const word of ['ocean','garden','orbit','music','bread']){const input=document.querySelector('#word');if(!input)break;input.value=word;document.querySelector('#guess').click()}return true})()`);
    await waitFor('document.querySelector("#replay")', 'Contexto results');
    const result = await run('JSON.stringify({scores:JSON.parse(localStorage.getItem("scores")||"{}"),history:JSON.parse(localStorage.getItem("history")||"[]")})');
    const data = JSON.parse(result);
    assert.ok(ids.every(id => Number.isFinite(data.scores[id])), 'all six games should save a best score');
    assert.ok(data.history.length >= 6, 'all six completed rounds should be in history');
    const percentage = await run('AfterglowCore.gamerPercentage(JSON.parse(localStorage.getItem("scores")||"{}"),' + JSON.stringify(ids) + ')');
    assert.ok(Number.isFinite(percentage), 'Gamer Percentage should calculate only after all six games');
    console.log('[QA] PASS: six playable rounds, replay, local best scores, history, and Gamer Percentage (' + percentage + '%).');
    app.quit();
  } catch (error) {
    console.error('[QA] FAIL:', error && error.stack || error);
    app.exit(1);
  }
};
