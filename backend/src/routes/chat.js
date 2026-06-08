const express = require('express');
const { body } = require('express-validator');
const chatController = require('../controllers/chatController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

router.get('/', chatController.getListChat);
router.get('/:chatId', chatController.getChatHistory);

router.post(
  '/init',
  [body('transaksiId').notEmpty().withMessage('transaksiId diperlukan')],
  chatController.initChat
);

module.exports = router;
