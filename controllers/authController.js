const usersDB = {
    users: require('../model/users.json'),
    setUsers: function (data) {this.users = data}
}

const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');
require('dotenv').config();
const fsPromises = require('fs').promises;
const path = require('path');

const handlerLogin = async (req, res) =>{
    const {user, pwd} = req.body;
    if(!user || !pwd) return res.status(400).json({ 'message': 'Username and password are required.'});
    const foundUser = usersDB.users.find(person => person.username === user);
    if (!foundUser) return res.sendStatus(401); //Unsuthorized
    // evaluate password
    const match = await bcrypt.compare(pwd, foundUser.password);
    if (match){
        // creat JWTs
        const accessToken =jwt.sign(
            {"username": foundUser.username},
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn:'30s'}
        );
        const refeshToken =jwt.sign(
            {"username": foundUser.username},
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn:'1d'}
        );
        const otherUsers = usersDB.users.filter(person => person.username !== foundUser.username);
        const currentUser = {...foundUser, refeshToken};
        usersDB.setUsers([...otherUsers, currentUser]);
        await fsPromises.writeFile(
            path.join(__dirname, '..','model','users.json'),
            JSON.stringify(usersDB.users)
        )
        //make cookie as http
        res.cookie('jwt', refeshToken, { httpOnly: true, maxAge: 24*60*60*1000});
        res.json({accessToken});
        /////////////
        //res.json({'success': `User ${user} is logged in!`});
    } else {
        res.sendStatus(401);
    }
}

module.exports = {handlerLogin};