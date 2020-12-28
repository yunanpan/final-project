const express = require('express')
const app = express()
const port = process.env.PORT || 5003
const bodyParser = require('body-parser')
const session = require('express-session')
const flash = require('connect-flash')
const bcrypt = require('bcrypt');
const cors = require('cors')
const jwt = require('jsonwebtoken')
const db = require('./models')
const { response } = require('express')
const schedules = db.Schedules
const users = db.Users
const Sequelize = require('sequelize')
const Op = Sequelize.Op;

const corsOptions = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions)); //設定 cors，預設非 same-origin 不能存取

app.set('view engine', 'ejs') //設定 view enging

//body parsor_middleware_可以解析 json / post 等資訊
app.use(bodyParser.urlencoded({ extended: false })) //parse urlencoed
app.use(bodyParser.json()) //parse json

//connect-flash，可以回傳 flash 
app.use(flash())

//用 res.locals 可以設定在 view 使用的變數
//express-session 設定
app.use(session({ 
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
}))

app.use(session({ 
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
}))

// //jwt_demo
// const payload ={
//   "sub" : "hittheroad",
//   "name" : "ian",
//   "admin" : false,
// }
// const secret = "12345"

// app.get('/jwt', (req, res) => {
//   const token = jwt.sign(payload, secret, { expiresIn: '1 day' })
//   req.session.token = token
//   return res.send('login')
// })

// app.get('/jwtverify', (req, res) => {
//   const token = req.header('Authorization').replace('Bearer ', "")
//   const decoded = jwt.verify(token, secret)
//   return res.send(JSON.stringify(token))
// })


//users
//register
app.post('/register/:method', (req, res) => {
  function checkIsUserExist(userData) {
    users.findOne({//驗證已註冊否
      where: {
        [Op.or]: [{username: userData}, {fbName: userData}]
      }
    }).then(response => {
      if(response) { 
        const response = {
          ok: false,
          message: "user exist"
        }
        const json = JSON.stringify(response)
        return res.end(json)
      }
    }).catch(error => {
      const response = {
        ok: false,
        message: error.toString()
      }
      const json = JSON.stringify(response)
      return res.end(json)
    })
  }

  function createUser(body, token, userData) {
    users.create(body)
    .then(() => {
      req.session.token = token //存 session token
      const response = {
        ok: true,
        message: "Created",
        userData,
      }
      const json = JSON.stringify(response)
      return res.end(json)
    }).catch(error => {
      const response = {
        ok: false,
        message: error.toString()
      }
      const json = JSON.stringify(response)
      res.send(json)
      return res.end(json)
    })
  }

  async function handleRegister() {
    const {
      username, 
      password,
      nickname,
      email,
    } = req.body
    const userData = {
      username,
      nickname,
      email
    }
    await checkIsUserExist(username)

    //創建新使用者
    const saltRounds = 10
    bcrypt.hash(password, saltRounds, function(err, hash) {
      if (err) {
        return res.end('errorMessage', err.toString())
      } else {
        const payload ={
          "sub" : "hittheroad",
          "name" : username,
          "admin" : false,
        }
        const secret = "12345"
        const token = jwt.sign(payload, secret, { expiresIn: '1 day' })
        const body = {
          username: username,
          password: hash,
          nickname: nickname,
          email: email,
          fbId: null,
          fbName: null,
          fbEmail: null,
          token,
        }
        createUser(body, token, userData)
      }
    })
  }

  async function handleFbRegister() {
    const {
      fbId, 
      fbName,
      fbEmail,
    } = req.body
    return res.end(fbId, fbName, fbEmail)

    const userData = {
      fbName,
      fbEmail,
    }
    await checkIsUserExist(fbName)

    //創建新使用者
    const saltRounds = 10
    bcrypt.hash(fbId, saltRounds, function(err, hash) {
      if (err) {
        return res.end('errorMessage', err.toString())
      } else {
        const payload ={
          "sub" : "hittheroad",
          "name" : fbName,
          "admin" : false,
        }
        const secret = "12345"
        const token = jwt.sign(payload, secret, { expiresIn: '1 day' })
        const body = {
          username: null,
          password: null,
          nickname: null,
          email: null,
          fbId: hash,
          fbName,
          fbEmail,
          token,
        }
        createUser(body, token, userData)
      }
    })
  }
  //判斷是哪種註冊
  if(req.params.method === "common") {
    handleRegister()
  } else {
    handleFbRegister()
  }
})

//login
app.post('/login/:method', (req, res) => {
  function handleLogin() {
    const { username, password } = req.body
    users.findOne({//驗證已註冊否
      where: {
        username : username,
      }
    }).then(userData => {
      if(!userData) { 
        const response = {
          ok: false,
          message: "you have not registered."
        }
        return res.end(JSON.stringify(response))
      }
      bcrypt.compare(password, userData.password, function(err, isSuccess) {
        if (err || !isSuccess) {
          const body = {
            ok: false,
            message: "wrong password"
          }
          return res.end(JSON.stringify(body))
        }
        req.session.token = response.token
        const body = {
          ok: true,
          message: "login",
          userData: {
            username : response.username,
            nickname : response.nickname,
            email: response.email
          }
        }
        const json = JSON.stringify(body)
        return res.end(json)
      })
    }).catch(error => {
      const response = {
        ok: false,
        message: error.toString()
      }
      const json = JSON.stringify(response)
      return res.end(json)
    })
  }

  function handleFbLogin() {
    const { fbId, fbName, fbEmail } = req.body
    if(!fbId || !fbName || !fbEmail) {
      res.end(JSON.stringify({
        ok: false,
        message: "please provide sound userData"
      }))
    }
    users.findOne({//驗證已註冊否
      where: {
        fbName : fbName,
      }
    }).then(userData => {
      if(!userData) { 
        const response = {
          ok: false,
          message: "you have not registered."
        }
        return res.end(JSON.stringify(response))
      }
      bcrypt.compare(fbId, userData.fbId, function(err, isSuccess) {
        if (err || !isSuccess) {
          const body = {
            ok: false,
            message: "wrong password"
          }
          return res.end(JSON.stringify(body))
        }
        req.session.token = response.token
        const body = {
          ok: true,
          message: "login",
          userData: {
            fbName : response.fbName,
            fbEmail : response.fbEmail,
          }
        }
        const json = JSON.stringify(body)
        return res.end(json)
      })
    }).catch(error => {
      const response = {
        ok: false,
        message: error.toString()
      }
      const json = JSON.stringify(response)
      return res.end(json)
    })
  }

  const method = req.params.method
  switch(method) {
    case "common" : 
      handleLogin()
      break
    case "fb" :
      handleFbLogin()
      break
    default :
      res.end(JSON.stringify("login fail"))
  }
  
})


//schedules
//getAll
const errorMessage = "there is some thing wrong"

//getQuery
app.get(`/schedules`, (req, res) => {
  //沒有設定 queryString
  if(req.query.isFinished === undefined) {
    req.session.UserId = 1
    const UserId = req.session.UserId
    if(!UserId) {
      console.log('fail login')
    }
    schedules.findAll({
      where : {
        UserId : req.session.UserId
      }
    }).then(schedules => {
      if(schedules) {
        return res.send(schedules)
      }
      res.end('no content')
    }).catch(error => {
      return res.send(error.toString())
    })
  } else if(req.query.isFinished) { //未完成
    req.session.UserId = 1
    const UserId = req.session.UserId
    if(!UserId) {
      console.log('fail login')
    }
    schedules.findAll({
      where : {
        UserId : req.session.UserId,
        isFinished: req.query.isFinished
      }
    }).then(schedules => {
      if(schedules) {
        return res.send(schedules)
      }
      res.end('no content')
    }).catch(error => {
      return res.send(error.toString())
    })
  } else {
    res.end()
  }
})




//getOne
app.get('/schedules/:id', (req, res) => {
  req.session.UserId = 1
  const UserId = req.session.UserId
  if(!UserId) {
    console.log('fail login')
  }
  schedules.findOne({
    where : {
      id : req.params.id,
      UserId : req.session.UserId
    }
  }).then(schedule => {
    if(schedule) {
      return res.send(schedule)
    }
    res.end('no content')
  }).catch(error => {
    return res.send(error.toString())
  })
})


//add
app.post('/schedules/', (req, res) => {
  req.session.UserId = 1
  const UserId = req.session.UserId
  if(!UserId) {
    console.log('fail login')
  }
  const {
    scheduleName,
    location,
    dailyRoutines,
    dateRange,
    isFinished,
    spots,
    spotsId,
    markers
  } = req.body
  
  const body = {
    scheduleName: scheduleName,
    location: location,
    dailyRoutines: dailyRoutines,
    dateRange: dateRange,
    isFinished: isFinished,
    spots: spots,
    spotsId: spotsId,
    markers: markers,
    UserId,
  }

  schedules.create(body)
  .then(() => {
    const body = {
      ok: true,
      message: "create success"
    }
    return res.end(JSON.stringify(body))
  }).catch(error => {
    const body = {
      ok: false,
      message: error.toString()
    }
    return res.end(JSON.stringify(body))
  })
})

//delete
app.delete('/schedules/:id', (req, res) => {
  req.session.UserId = 1
  const UserId = req.session.UserId
  if(!UserId) {
    console.log('fail login')
  }
  schedules.findOne({
    where : {
      id : req.params.id,
      UserId,
    }
  }).then(schedule => {
    schedule.destroy()
    .then(() => {
      const body = {
        ok: true,
        message: "delete success"
      }
      return res.end(JSON.stringify(body))
    })
  }).catch(error => {
    const body = {
      ok: false,
      message: error.toString()
    }
    return res.end(JSON.stringify(body))
  })
})

//update_put
app.put('/schedules/:id', (req, res) => {
  req.session.UserId = 1
  const UserId = req.session.UserId
  if(!UserId) {
    console.log('fail login')
  }
  const {
    scheduleName,
    location,
    dailyRoutines,
    dateRange,
    isFinished,
    spots,
    spotsId,
    markers
  } = req.body
  
  const body = {
    scheduleName: scheduleName,
    location: location,
    dailyRoutines: dailyRoutines,
    dateRange: dateRange,
    isFinished: isFinished,
    spots: spots,
    spotsId: spotsId,
    markers: markers,
    UserId,
  }

  schedules.findOne({
    where : {
      id : req.params.id,
      UserId,
    }
  }).then(schedule => {
    schedule.update(body)
    .then(() => {
      const body = {
        ok: true,
        message: "update success"
      }
      return res.end(JSON.stringify(body))
    }).catch(error => {
      const body = {
        ok: false,
        message: error.toString()
      }
      return res.end(JSON.stringify(body))
    })
  }).catch(error => {
    const body = {
      ok: false,
      message: error.toString()
    }
    return res.end(JSON.stringify(body))
  })
})



app.listen(port, () => { //監聽 port
  console.log(`Example app listening at http://localhost:${port}`)
})