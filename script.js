const blockchain = []

const initialTransactions = [
	{
		sender: 'Alice',
		receiver: 'Bob',
		amount: 100,
		status: 'Confirmed',
	},
	{
		sender: 'Bob',
		receiver: 'Charlie',
		amount: 50,
		status: 'Confirmed',
	},
	{
		sender: 'Charlie',
		receiver: 'David',
		amount: 75,
		status: 'Pending',
	},
	{
		sender: 'David',
		receiver: 'Alice',
		amount: 25,
		status: 'Confirmed',
	},
	{
		sender: 'Alice',
		receiver: 'Eve',
		amount: 200,
		status: 'Rejected',
	},
]

// Генерация SHA-256
async function calculateHash(data) {
	const encoder = new TextEncoder()

	const dataBuffer = encoder.encode(JSON.stringify(data))

	const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)

	const hashArray = Array.from(new Uint8Array(hashBuffer))

	return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('')
}

function getBlockData(block) {
	return {
		blockNumber: block.blockNumber,
		id: block.id,
		timestamp: block.timestamp,
		transaction: {
			id: block.transaction.id,
			sender: block.transaction.sender,
			receiver: block.transaction.receiver,
			amount: block.transaction.amount,
		},
		previousHash: block.previousHash,
	}
}

// Создание блока
async function createBlock(transaction) {
	const previousBlock = blockchain[blockchain.length - 1]

	const block = {
		blockNumber: blockchain.length + 1,
		id: crypto.randomUUID(),
		timestamp: new Date().toISOString(),
		transaction: transaction,
		previousHash: previousBlock ? previousBlock.hash : '0',
		hash: '',
	}

	block.hash = await calculateHash(getBlockData(block))

	blockchain.push(block)
}

// Проверка целостности цепочки
async function verifyBlockchain() {
	for (let i = 0; i < blockchain.length; i++) {
		const block = blockchain[i]

		const calculatedHash = await calculateHash(getBlockData(block))

		// Проверяем собственный хеш блока
		if (block.hash !== calculatedHash) {
			return false
		}

		// Проверяем связь с предыдущим блоком
		if (i > 0) {
			if (block.previousHash !== blockchain[i - 1].hash) {
				return false
			}
		} else if (block.previousHash !== '0') {
			return false
		}
	}

	return true
}

// Отображение транзакций
function renderTransactions() {
	const table = document.getElementById('transactionTable')

	table.innerHTML = ''

	blockchain.forEach(block => {
		const transaction = block.transaction

		const row = document.createElement('tr')

		const values = [
			block.blockNumber,
			transaction.sender,
			transaction.receiver,
			transaction.amount,
			block.hash.substring(0, 16) + '...',
			transaction.status,
		]

		values.forEach(value => {
			const cell = document.createElement('td')
			cell.textContent = value
			row.appendChild(cell)
		})

		const statusCell = row.lastElementChild

		statusCell.className = 'status ' + transaction.status.toLowerCase()

		table.appendChild(row)
	})

	document.getElementById('blockCount').textContent = blockchain.length

	document.getElementById('transactionCount').textContent = blockchain.length
}

// Обновление статуса целостности
async function updateChainStatus() {
	const valid = await verifyBlockchain()

	const element = document.getElementById('chainStatus')

	element.textContent = valid ? 'Целостна' : 'Нарушена'

	element.style.color = valid ? '#4bd68b' : '#ff6565'
}

// Добавление транзакции
document
	.getElementById('transactionForm')
	.addEventListener('submit', async function (event) {
		event.preventDefault()

		const sender = document.getElementById('sender').value.trim()
		const receiver = document.getElementById('receiver').value.trim()
		const amount = Number(document.getElementById('amount').value)

		if (
			!sender ||
			!receiver ||
			sender === receiver ||
			!Number.isFinite(amount) ||
			amount <= 0
		) {
			alert('Введите корректные данные транзакции')
			return
		}

		const transaction = {
			id: crypto.randomUUID(),
			sender: sender,
			receiver: receiver,
			amount: amount,
			status: 'Pending',
		}

		await createBlock(transaction)

		renderTransactions()
		await updateChainStatus()

		this.reset()

		// Автоматическое подтверждение
		setTimeout(async () => {
			transaction.status = 'Confirmed'

			renderTransactions()
			await updateChainStatus()
		}, 2000)
	})

// Кнопка проверки
document
	.getElementById('verifyButton')
	.addEventListener('click', async function () {
		const result = await verifyBlockchain()

		const message = document.getElementById('verificationResult')

		if (result) {
			message.textContent = 'Цепочка блоков не повреждена!'
			message.style.color = '#4bd68b'
		} else {
			message.textContent = 'ОШИБКА! Обнаружено изменение данных!'
			message.style.color = '#ff6565'
		}

		await updateChainStatus()
	})

// Имитация изменения данных
document
	.getElementById('tamperButton')
	.addEventListener('click', async function () {
		if (blockchain.length === 0) return

		blockchain[0].transaction.amount += 100

		renderTransactions()
		await updateChainStatus()

		document.getElementById('verificationResult').textContent =
			'Данные изменены. Запустите проверку целостности!'

		document.getElementById('verificationResult').style.color = '#ff6565'
	})

// Первоначальная загрузка
async function initializeBlockchain() {
	for (const transaction of initialTransactions) {
		const newTransaction = {
			id: crypto.randomUUID(),
			...transaction,
		}

		await createBlock(newTransaction)
	}

	renderTransactions()
	await updateChainStatus()

	document.getElementById('verificationResult').textContent =
		'Цепочка успешно создана'
}

initializeBlockchain()

// Автоматическое обновление интерфейса
setInterval(async () => {
	renderTransactions()
	await updateChainStatus()
}, 5000)
