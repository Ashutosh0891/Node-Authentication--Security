const fs=require('fs')
const path=require('path')
const https=require('https')
const express=require('express');
const app=express();
const helmet=require('helmet');   //helps securing apps by setting responsive headers
const passport =require('passport') //authenticate user
const {Strategy}=require('passport-google-oauth20')
const cookieSession=require('cookie-session')


const PORT=3000

require('dotenv').config()

const config={
  CLIENT_ID:process.env.CLIENT_ID,
  CLIENT_SECRET:process.env.CLIENT_SECRET,
  COOKIE_KEY_1:process.env.COOKIE_KEY_1,
  COOKIE_KEY_2:process.env.COOKIE_KEY_2
}

const AUTH_OPTIONS={
  callbackURL:'/auth/google/callback',
  clientID:config.CLIENT_ID,
  clientSecret:config.CLIENT_SECRET
}

function verifyCallback(accessToken,refreshToken,profile,done){
  console.log('google profile',profile)
  console.log(accessToken)
  done(null,profile)  //passport knows user is loggedIn and returns user profile
}
passport.use(new Strategy(AUTH_OPTIONS, verifyCallback));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Read the session from the cookie
passport.deserializeUser((id, done) => {
   done(null, id);
});
app.use(helmet())

app.use(cookieSession({
  name: 'session',
  maxAge: 24 * 60 * 60 * 1000,
  keys: [ config.COOKIE_KEY_1, config.COOKIE_KEY_2 ],
}));
app.use(passport.initialize())  //Intializes Passport for incoming requests, allowing authentication strategies to be applied   

app.use(passport.session())    // intialize passport session


function checkLoggedIn(req, res, next) { 
  console.log('Current user is:', req.user);
  const isLoggedIn = req.isAuthenticated() && req.user;
  if (!isLoggedIn) {
    return res.status(401).json({
      error: 'You must log in!',
    });
  }
  next();
}

app.get('/auth/google',passport.authenticate(('google'),{
  scope:['email']
}))


app.get('/auth/google/callback'
,passport.authenticate('google',{
  failureRedirect:'/failure',
  successRedirect:'/',
  session:false
})
,(req,res)=>{
  console.log('google callback')
})

app.get('/auth/logout', (req, res) => {
  req.logout(); //Removes req.user and clears any logged in session
  return res.redirect('/');
});


app.get('/failure',(req,res)=>{
  res.send('failed to login')
})


app.get('/secret',checkLoggedIn,(req,res)=>{
  res.send('hey there your secret is 54')
})

app.get('/',(req,res)=>{
  res.sendFile(path.join(__dirname,'public','index.html'))
})

https.createServer({
  key:fs.readFileSync('key.pem'),
  cert:fs.readFileSync('cert.pem')
},app).listen(PORT,()=>{
  console.log(`server is running on port ${PORT}`)
})


// const cluster=require('cluster');
// const os=require('os')

// function delay(duration){
//   const startTime=Date.now()
//   while(Date.now()-startTime<duration){

//   }
// }

// app.get('/',(req,res)=>{
//   res.send(`Performance example:${process.pid}`)
// })

// app.get('/timer',(req,res)=>{
//   delay(9000)
//   res.send(`hey there:${process.pid}`)
// })


// if(cluster.isMaster){
//   console.log('master process has started')
//   const NUM_WORKERS=os.cpus().length;
//   for (let i = 0; i < NUM_WORKERS; i++) {
//     cluster.fork()
    
//   }
  
 
// }
// else{
//   console.log('worker process is running')
//   app.listen(3000)
// }