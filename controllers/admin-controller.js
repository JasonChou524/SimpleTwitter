const jwt = require('jsonwebtoken')
const { Sequelize } = require('sequelize')

const { User, Tweet } = require('../models')

const adminController = {
  signIn: (req, res, next) => {
    try {
      if (req.user.error) {
        return res.status(400).json(req.user.error)
      }

      if (req.user.role !== 'admin') {
        return res.status(400).json({
          status: 'error',
          message: '帳號或密碼錯誤!'
        })
      }

      const userData = req.user.toJSON()
      delete userData.password
      delete userData.introduction
      delete userData.createdAt
      delete userData.updatedAt
      const token = jwt.sign(userData, process.env.JWT_SECRET, {
        expiresIn: '30d'
      })
      res.status(200).json({
        status: 'success',
        token,
        user: userData
      })
    } catch (err) {
      next(err)
    }
  },
  getUsers: async (req, res, next) => {
    try {
      const users = await User.findAll({
        attributes: [
          'id',
          'name',
          'avatar',
          'account',
          'front_cover',
          [
            Sequelize.literal(
              '(SELECT COUNT(*) FROM Tweets WHERE Tweets.UserId = User.id)'
            ),
            'tweetsCount'
          ],
          [
            Sequelize.literal(
              '(SELECT COUNT(*) FROM Likes WHERE Likes.UserId = User.id)'
            ),
            'likedTweetsCount'
          ],
          [
            Sequelize.literal(
              '(SELECT COUNT(*) FROM Followships WHERE Followships.followerId = User.id)'
            ),
            'followingsCount'
          ],
          [
            Sequelize.literal(
              '(SELECT COUNT(*) FROM Followships WHERE Followships.followingId = User.id)'
            ),
            'followersCount'
          ]
        ],
        order: [[Sequelize.literal('tweetsCount'), 'DESC'], ['name', 'ASC']]
      })
      res.status(200).json(users)
    } catch (error) {
      next(error)
    }
  },
  deleteTweet: async (req, res, next) => {
    try {
      const tweetId = Number(req.params.id)
      const tweet = await Tweet.findByPk(tweetId)

      if (!tweet) res.status(404).json({ status: 'error', message: '找不到此推文!' })

      await tweet.destroy()

      return res.status(200).json({
        status: 'success',
        message: '刪除推文成功!',
        tweet
      })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = adminController
