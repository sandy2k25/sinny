const express = require('express');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

// Token storage
const tokenStore = {};

// Server list (labeled S1, S2...)
const servers = {
  S1: id => `https://vidzee.wtf/movie/${id}`,
  S2: id => `https://letsembed.cc/embed/movie/?id=${id}`,
  S3: id => `https://player.autoembed.cc/embed/movie/${id}?autoplay=true`,
  S4: id => `https://www.vidstream.site/embed/movie/${id}`,
  S5: id => `https://vidfast.pro/movie/${id}?autoPlay=true`,
  S6: id => `https://player.smashystream.com/movie/${id}`,
  S7: id => `https://111movies.com/movie/${id}`,
  S8: id => `https://vidjoy.pro/embed/movie/${id}?adFree=true`,
  S9: id => `https://www.vidsrc.wtf/api/1/movie/?id=${id}`,
  S10: id => `https://vidlink.pro/movie/${id}?autoplay=true&title=true`
};

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Default route: redirect to S1
app.get('/play/:id([0-9]+)', (req, res) => {
  const { id } = req.params;
  res.redirect(`/play/S1/${id}`);
});

// Server selection route
app.get('/play/:server/:id', (req, res) => {
  const { server, id } = req.params;
  if (!servers[server]) return res.status(404).send('Invalid server');

  const token = crypto.randomBytes(16).toString('hex');
  tokenStore[token] = { server, id, expires: Date.now() + 60000 };
  res.redirect(`/secure/${token}`);
});

// Secure token-based player
app.get('/secure/:token', (req, res) => {
  const entry = tokenStore[req.params.token];
  if (!entry || Date.now() > entry.expires) return res.send('Token expired or invalid.');

  const streamUrl = servers[entry.server](entry.id);

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Movie Player</title>
      <style>
        html, body { margin: 0; background: #000; height: 100%; overflow: hidden; }
        iframe { width: 100vw; height: 100vh; border: none; display: block; }
        #loader { position: fixed; top: 10px; right: 10px; background: rgba(255,255,255,0.1); color: white; padding: 6px 10px; border-radius: 10px; font-family: sans-serif; backdrop-filter: blur(5px); }
      </style>
    </head>
    <body>
      <div id="loader">Loading...</div>
      <div id="player"></div>
      <script>
        document.addEventListener('contextmenu', e => e.preventDefault());
        document.onkeydown = e => {
          if (e.keyCode == 123 || (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(e.key.toUpperCase())) || (e.ctrlKey && e.key.toLowerCase() === 'u')) {
            location.reload(); return false;
          }
        };
        const iframe = document.createElement('iframe');
        iframe.src = "${streamUrl}";
        iframe.allowFullscreen = true;
        iframe.sandbox = "allow-scripts allow-same-origin";
        iframe.onload = () => document.getElementById("loader").style.display = "none";
        document.getElementById("player").appendChild(iframe);
      </script>
    </body>
    </html>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`Running at http://localhost:${PORT}`);
});
