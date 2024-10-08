import { Router } from 'express'
import userModel from '../Models/user.model.js'
import patientModel from '../Models/patient.model.js'
import specimenModel from '../Models/specimen.model.js'
import reportModel from '../Models/report.model.js'
import newSpecimenModel from '../Models/newspecimen.model.js'
import newPatientModel from '../Models/newpatient.model.js'
import newReportModel from '../Models/newreport.model.js'
const router = Router()

const login = async (req, res, next) => {
	const { username, password } = req.body

	try {
		//console.log(username)
		// const users = await userModel.find({})
		const user = await userModel.findOne({ username }).select('+password') // if user exists then give me his/her password
		// //console.log(users)
		//console.log(user)
		// const user = await User.findOne({ "email":email },{"_id":0,"password":1,"email":1}); // if user exists then give me his/her password
		// //console.log("user->",user)

		if (!user) {
			return next(new AppError('Email doesnt exist!', 400))
		}
		const isPasswordValid = password === user.password

		if (!isPasswordValid) {
			return alert('Incorrect Password!')
		}

		res.status(200).json({
			success: true,
			message: 'User loggedIn successfully',
			user,
		})
	} catch (e) {
		return res.status(500).json({
			success: false,
			message: e,
		})
	}
}

const patientDetails = async (req, res, next) => {
	try {
		let { patient_mobile, patient_name } = req.body

		//console.log(patient_mobile, patient_name)

		let patientData = await patientModel.findOne(
			{ patient_mobile, patient_name },
			{ _id: 0 }
		)

		if (!patientData) {
			res.status(500).json({
				success: false,
				message: 'Patient does not exist',
			})
			return
		}

		res.status(201).json({
			success: true,
			message: 'Fetched Patient Details Successfully!',
			patientData: patientData,
		})
	} catch (error) {
		//console.log(error)
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

const newSpecimenRegister = async (req, res, next) => {
	try {
		let { patient_data, specimen_data } = req.body

		patient_data = {
			...patient_data,
		}

		let { lab_id } = patient_data

		specimen_data = {
			...specimen_data,
		}

		console.log(lab_id)

		await newPatientModel.insertMany(patient_data)
		await newSpecimenModel.insertMany(specimen_data)

		res.status(201).json({
			success: true,
			message: 'Data Added Successfully!',
			lab_id,
		})
	} catch (error) {
		console.log(error)
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

const ExistingSpecimenRegister = async (req, res, next) => {
	try {
		let { patient_id, specimen_data } = req.body

		specimen_data = {
			...specimen_data,
			patient_id: patient_id,
		}

		await specimenModel.insertMany(specimen_data)

		res.status(201).json({
			success: true,
			message: 'Data Added Successfully!',
			patientId: patient_id,
		})
	} catch (error) {
		//console.log(error)
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

const specimenNumber = async (req, res, next) => {
	try {
		const count = (await specimenModel.countDocuments({})) + 1
		//console.log(count)

		res.status(201).json({
			success: true,
			message: 'Data Added Successfully!',
			count,
		})
	} catch (error) {
		//console.log(error)
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

const reportRegister = async (req, res, next) => {
	try {
		const { report_data } = req.body
		//console.log(report_data)
		const today = new Date(report_data.report_date)
		//console.log(today)
		const month = [
			'January',
			'February',
			'March',
			'April',
			'May',
			'June',
			'July',
			'August',
			'September',
			'October',
			'November',
			'December',
		]
		report_data.month = month[today.getMonth()]
		report_data.year = today.getFullYear()
		await newReportModel.insertMany(report_data)

		res.status(201).json({
			success: true,
			message: 'Report Added Successfully!',
		})
	} catch (error) {
		//console.log(error)
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

const getReport = async (req, res, next) => {
	try {
		let { patient_id, specimen_id } = req.body

		let report = await reportModel.findOne(
			{ patient_id, specimen_id },
			{ _id: 0 }
		)
		let patientData = await patientModel.findOne({ patient_id }, { _id: 0 })
		let specimenData = await specimenModel.findOne(
			{ patient_id, specimen_id },
			{ _id: 0 }
		)
		res.status(201).json({
			success: true,
			message: 'Fetched Report Successfully!',
			report: report,
			patientData: patientData,
			specimenData: specimenData,
		})
	} catch (error) {
		//console.log(error)
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}
const getNewReport = async (req, res, next) => {
	try {
		let { lab_id } = req.body

		let report = await newReportModel.findOne({ lab_id }, { _id: 0 })
		let patientData = await newPatientModel.findOne({ lab_id }, { _id: 0 })
		let specimenData = await newSpecimenModel.findOne({ lab_id }, { _id: 0 })
		res.status(201).json({
			success: true,
			message: 'Fetched Report Successfully!',
			report: report,
			patientData: patientData,
			specimenData: specimenData,
		})
	} catch (error) {
		//console.log(error)
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}
const getDetails = async (req, res, next) => {
	try {
		let { lab_id } = req.body
		//console.log(patient_id)
		//console.log(specimen_id)

		console.log(lab_id)

		let patientData = await newPatientModel.findOne(
			{ lab_id: lab_id },
			{ _id: 0 }
		)

		let specimenData = await newSpecimenModel.findOne(
			{ lab_id: lab_id },
			{ _id: 0 }
		)
		//console.log(specimenData)
		res.status(201).json({
			success: true,
			message: 'Fetched Report Successfully!',

			patientData: patientData,
			specimenData: specimenData,
		})
	} catch (error) {
		//console.log(error)
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}
const getPatientHistory = async (req, res, next) => {
	try {
		let { patient_id, specimen_id } = req.body

		let patientData = await patientModel.findOne({ patient_id }, { _id: 0 })
		let specimenData = await specimenModel.find(
			{ patient_id, specimen_id },
			{ _id: 0 }
		)
		res.status(201).json({
			success: true,
			message: 'Fetched Patient History Successfully!',
			patientData: patientData,
			specimenData: specimenData,
		})
	} catch (error) {
		//console.log(error)
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

const getMonthlyData = async (req, res, next) => {
	try {
		const { month, year } = req.body
		//console.log(month, year)
		const data = await reportModel.find(
			{
				month: month,
				year: year,
			},
			{ _id: 0, __v: 0 }
		)
		const patients = await patientModel.find({}, { _id: 0, __v: 0 })
		const specimens = await specimenModel.find({}, { _id: 0, __v: 0 })
		const report = data.map((d1) => {
			const patient = patients.find((p) => p.patient_id === d1.patient_id)
			const specimen = specimens.find((s) => s.specimen_id === d1.specimen_id)

			const mergedDocument = {
				...patient._doc,
				...d1._doc,
				...specimen._doc,
			}
			delete mergedDocument.specimen_id
			delete mergedDocument.patient_id
			// console.log(mergedDocument);
			return mergedDocument
		})
		let ast = []
		data.forEach((element) => {
			ast.push(...element.ast)
		})
		let arr = []
		let micro = {}
		ast.forEach((element) => {
			let id = arr.findIndex((item) => item.Microbe === element.Microbe)
			if (id === -1) {
				let ax = {
					Microbe: element.Microbe,
					Antibiotics: {},
				}
				micro[element.Microbe] = 1
				let anti = element.Antibiotic
				if (ax.Antibiotics[anti]) {
					ax.Antibiotics[anti].push(element.Result)
				} else {
					ax.Antibiotics[anti] = [element.Result]
				}

				arr.push(ax)
			} else {
				micro[element.Microbe] += 1
				let anti = element.Antibiotic
				if (arr[id].Antibiotics[anti]) {
					arr[id].Antibiotics[anti].push(element.Result)
				} else {
					arr[id].Antibiotics[anti] = [element.Result]
				}
			}
		})
		res.status(201).json({
			success: true,
			message: 'Fetched Patient History Successfully!',
			data: arr,
			micro,
			report,
		})
	} catch (error) {
		//console.log(error)
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}
const getNewMonthlyData = async (req, res, next) => {
	try {
		const { month, year } = req.body
		//console.log(month, year)
		const data = await newReportModel.find(
			{
				month: month,
				year: year,
			},
			{ _id: 0, __v: 0 }
		)
		const patients = await newPatientModel.find({}, { _id: 0, __v: 0 })
		const specimens = await newSpecimenModel.find({}, { _id: 0, __v: 0 })
		const report = data.map((d1) => {
			const patient = patients.find((p) => p.patient_id === d1.patient_id)
			const specimen = specimens.find((s) => s.specimen_id === d1.specimen_id)

			const mergedDocument = {
				...patient._doc,
				...d1._doc,
				...specimen._doc,
			}
			delete mergedDocument.specimen_id
			delete mergedDocument.patient_id
			// console.log(mergedDocument);
			return mergedDocument
		})
		let ast = []
		data.forEach((element) => {
			ast.push(...element.ast)
		})
		let arr = []
		let micro = {}
		ast.forEach((element) => {
			let id = arr.findIndex((item) => item.Microbe === element.Microbe)
			if (id === -1) {
				let ax = {
					Microbe: element.Microbe,
					Antibiotics: {},
				}
				micro[element.Microbe] = 1
				let anti = element.Antibiotic
				if (ax.Antibiotics[anti]) {
					ax.Antibiotics[anti].push(element.Result)
				} else {
					ax.Antibiotics[anti] = [element.Result]
				}

				arr.push(ax)
			} else {
				micro[element.Microbe] += 1
				let anti = element.Antibiotic
				if (arr[id].Antibiotics[anti]) {
					arr[id].Antibiotics[anti].push(element.Result)
				} else {
					arr[id].Antibiotics[anti] = [element.Result]
				}
			}
		})
		res.status(201).json({
			success: true,
			message: 'Fetched Patient History Successfully!',
			data: arr,
			micro,
			report,
		})
	} catch (error) {
		//console.log(error)
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

router.post('/login', login)
router.post('/patient-details', patientDetails)
router.post('/report', getMonthlyData)
router.post('/updated-report', getNewMonthlyData)
router.post('/new-specimen', newSpecimenRegister)

router.post('/existing-specimen-register', ExistingSpecimenRegister)

router.post('/specimen-id', specimenNumber)
router.post('/new-report', reportRegister)
router.post('/get-report-details', getDetails)

router.post('/get-report', getReport)
router.post('/get-new-report', getNewReport)

// router.post('/get-patient-data', getPatientHistory)

export default router
