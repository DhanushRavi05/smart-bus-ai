import sys
with open('public/index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_css = '''    /* -- SPLASH ROOT ------------------------------------- */
    #splash-screen {
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      z-index: 99999;
      background: url('/images/real_highway_bg.jpg') no-repeat center center;
      background-size: cover;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .particles-container {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: none;
      z-index: 10;
    }

    .real-bus {
      position: absolute;
      bottom: 2%;
      z-index: 20;
    }
    
    .real-bus img {
      width: 100%;
      height: auto;
      filter: drop-shadow(0 20px 20px rgba(0,0,0,0.8));
    }

    /* -- BUS 1 — enters from LEFT ----- */
    #bus-left-real {
      width: 45%;
      left: -60%;
      animation: busEnterLeftReal 2.5s cubic-bezier(0.16,1,0.3,1) forwards 0.4s;
    }
    @keyframes busEnterLeftReal {
      0%   { left: -60%; transform: scale(0.9); opacity: 0; }
      100% { left: 2%; transform: scale(1); opacity: 1; }
    }

    /* -- BUS 2 — enters from RIGHT ------ */
    #bus-right-real {
      width: 45%;
      right: -60%;
      animation: busEnterRightReal 2.5s cubic-bezier(0.16,1,0.3,1) forwards 0.7s;
    }
    @keyframes busEnterRightReal {
      0%   { right: -60%; transform: scale(0.9) scaleX(-1); opacity: 0; }
      100% { right: 2%; transform: scale(1) scaleX(-1); opacity: 1; }
    }

    /* -- BUS 3 — centre background fade -- */
    #bus-center-real {
      width: 30%;
      left: 50%;
      bottom: 25%;
      transform: translateX(-50%) scale(0.8);
      opacity: 0;
      z-index: 15;
      animation: busCenterInReal 2s ease forwards 1.2s;
    }
    @keyframes busCenterInReal {
      0%   { opacity: 0; transform: translateX(-50%) scale(0.5); }
      100% { opacity: 0.8; transform: translateX(-50%) scale(0.8); }
    }

    /* -- WELCOME TITLE BURST ------------------------------ */
    .splash-center {
      position: relative;
      z-index: 30;
      text-align: center;
      margin-bottom: 50px;
    }
    .welcome-small {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.9rem;
      letter-spacing: 8px;
      color: #fff;
      text-transform: uppercase;
      opacity: 0;
      text-shadow: 0 0 10px rgba(0,0,0,0.8);
      animation: fadeSlideUp 0.6s ease forwards 2.5s;
      margin-bottom: 10px;
    }
    .welcome-big {
      font-family: 'Orbitron', sans-serif;
      font-size: clamp(2rem, 5vw, 4rem);
      font-weight: 900;
      letter-spacing: 3px;
      line-height: 1.2;
      color: #ffffff;
      text-shadow: 0 0 20px rgba(0,0,0,0.9), 0 0 40px rgba(21,101,192,0.8);
      opacity: 0;
      animation: welcomeBurst 0.9s cubic-bezier(0.34,1.56,0.64,1) forwards 2.8s;
    }
    .welcome-sub {
      font-family: 'Outfit', sans-serif;
      font-size: 1.1rem;
      color: #bfdbfe;
      text-shadow: 0 0 10px rgba(0,0,0,0.8);
      letter-spacing: 3px;
      margin-top: 15px;
      opacity: 0;
      animation: fadeSlideUp 0.6s ease forwards 3.1s;
    }

    /* -- ANIMATIONS --------------------------------------- */
    @keyframes fadeSlideUp {
      0%   { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes welcomeBurst {
      0%   { opacity: 0; transform: scale(0.7) translateY(20px); filter: blur(10px); }
      50%  { opacity: 1; transform: scale(1.05) translateY(-5px); filter: blur(0px); }
      100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0px); }
    }

    /* -- ENTER BUTTON ------------------------------------- */
    .enter-btn {
      position: relative;
      margin-top: 40px;
      padding: 16px 40px;
      background: linear-gradient(135deg, rgba(21,101,192,0.8), rgba(16,185,129,0.8));
      border: 2px solid #60a5fa;
      border-radius: 4px;
      color: #fff;
      font-family: 'Orbitron', sans-serif;
      font-size: 1.1rem;
      font-weight: 700;
      letter-spacing: 2px;
      cursor: pointer;
      overflow: hidden;
      box-shadow: 0 0 20px rgba(21,101,192,0.6);
      transition: all 0.3s ease;
      opacity: 0;
      animation: btnFadeIn 0.8s ease forwards 3.6s;
    }
    .enter-btn:hover {
      background: linear-gradient(135deg, rgba(21,101,192,1), rgba(16,185,129,1));
      box-shadow: 0 0 40px rgba(21,101,192,0.8), 0 0 20px rgba(16,185,129,0.6);
      transform: scale(1.05);
      border-color: #10b981;
    }
    @keyframes btnFadeIn {
      0%   { opacity: 0; transform: translateY(18px) scale(0.9); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* -- EXIT ANIMATION ----------------------------------- */
    #splash-screen.exit {
      animation: splashExit 0.8s cubic-bezier(0.16,1,0.3,1) forwards;
    }
    @keyframes splashExit {
      0%   { opacity: 1; transform: scale(1); }
      100% { opacity: 0; transform: scale(1.1); pointer-events: none; }
    }
'''

new_html = '''<div id="splash-screen">

  <!-- Background layers -->
  <div class="particles-container" id="particles-box"></div>

  <!-- --- BUS 1 : MTC (Left) --------------- -->
  <div class="real-bus" id="bus-left-real">
    <img src="/images/mtc_bus_real.png" alt="MTC Bus">
  </div>

  <!-- --- BUS 2 : SETC (Right) -------------- -->
  <div class="real-bus" id="bus-right-real">
    <img src="/images/setc_bus_real.png" alt="SETC Bus">
  </div>

  <!-- --- BUS 3 : TNSTC (Center Background) -- -->
  <div class="real-bus" id="bus-center-real">
    <img src="/images/tnstc_bus_real.png" alt="TNSTC Bus">
  </div>

  <!-- --- CENTRE WELCOME TITLE ------------------- -->
  <div class="splash-center">
    <div class="welcome-small">?? GOVERNMENT OF TAMIL NADU</div>
    <div class="welcome-big">WELCOME TO<br>TAMIL NADU<br>SMART BUS AI</div>
    <div class="welcome-sub">MTC &nbsp;·&nbsp; TNSTC &nbsp;·&nbsp; SETC &nbsp;·&nbsp; Enterprise Command Portal</div>

    <button class="enter-btn" id="btn-enter-portal" onclick="dismissSplash()">
      <i class="fa-solid fa-bus-simple"></i>
      ENTER PORTAL
    </button>
  </div>

</div>'''

start_css = 0
end_css = 0
start_html = 0
end_html = 0

for i, line in enumerate(lines):
    if '/* -- SPLASH ROOT' in line:
        start_css = i
    if '</style>' in line:
        end_css = i
    if '<div id="splash-screen">' in line:
        start_html = i
    if '<div id="app-root" style="display: none;">' in line:
        end_html = i

if start_css > 0 and end_css > 0 and start_html > 0 and end_html > 0:
    final_lines = lines[:start_css] + [new_css + '\n'] + lines[end_css:start_html] + [new_html + '\n'] + lines[end_html:]
    with open('public/index.html', 'w', encoding='utf-8') as f:
        f.writelines(final_lines)
    print('Successfully updated index.html')
else:
    print('Failed to find markers')
