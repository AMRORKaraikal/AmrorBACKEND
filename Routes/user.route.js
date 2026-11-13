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

// Builds the chart data for the Monthly Analytics page from a month's reports.
//   data  -> one entry per organism, with every antibiotic result recorded for it
//   micro -> number of isolates per organism (each report counts an organism once,
//            however many antibiotics were tested against it)
const summariseAst = (reports) => {
	const arr = []
	const micro = {}
	reports.forEach((r) => {
		const organismsInReport = new Set()
		;(r.ast || []).forEach((element) => {
			if (!element || !element.Microbe) return
			organismsInReport.add(element.Microbe)
			let entry = arr.find((item) => item.Microbe === element.Microbe)
			if (!entry) {
				entry = { Microbe: element.Microbe, Antibiotics: {} }
				arr.push(entry)
			}
			const anti = element.Antibiotic
			if (entry.Antibiotics[anti]) {
				entry.Antibiotics[anti].push(element.Result)
			} else {
				entry.Antibiotics[anti] = [element.Result]
			}
		})
		organismsInReport.forEach((m) => {
			micro[m] = (micro[m] || 0) + 1
		})
	})
	return { data: arr, micro }
}

// Index documents by a key, keeping the first document for each key
// (the same one the Print Report screen's findOne() returns).
const indexBy = (docs, key) => {
	const map = new Map()
	docs.forEach((d) => {
		const k = d[key]
		if (k !== undefined && k !== null && k !== '' && !map.has(k)) {
			map.set(k, d._doc || d)
		}
	})
	return map
}

// Old data (before the Lab ID system): reports link to patients by patient_id
// and to specimens by patient_id + specimen_id.
const getMonthlyData = async (req, res, next) => {
	try {
		const { month } = req.body
		const year = Number(req.body.year)
		const data = await reportModel.find({ month, year }, { _id: 0, __v: 0 })

		const patientIds = [
			...new Set(data.map((d) => d.patient_id).filter((v) => v)),
		]
		const patients = await patientModel.find(
			{ patient_id: { $in: patientIds } },
			{ _id: 0, __v: 0 }
		)
		const specimens = await specimenModel.find(
			{ patient_id: { $in: patientIds } },
			{ _id: 0, __v: 0 }
		)
		const patientById = indexBy(patients, 'patient_id')
		const specimenByKey = new Map()
		specimens.forEach((s) => {
			const k = `${s.patient_id}|${s.specimen_id}`
			if (!specimenByKey.has(k)) specimenByKey.set(k, s._doc)
		})

		const report = data.map((d1) => {
			const merged = {
				...(patientById.get(d1.patient_id) || {}),
				...(specimenByKey.get(`${d1.patient_id}|${d1.specimen_id}`) || {}),
				...d1._doc,
			}
			delete merged.__v
			return merged
		})

		const { data: arr, micro } = summariseAst(data)
		res.status(201).json({
			success: true,
			message: 'Fetched Monthly Report Successfully!',
			data: arr,
			micro,
			report,
		})
	} catch (error) {
		console.log(error)
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

// New data (Lab ID system): the report, the patient and the specimen
// are all linked by lab_id.
const getNewMonthlyData = async (req, res, next) => {
	try {
		const { month } = req.body
		const year = Number(req.body.year)
		const data = await newReportModel.find({ month, year }, { _id: 0, __v: 0 })

		// Fetch only the patients/specimens for this month's Lab IDs.
		const labIds = [...new Set(data.map((d) => d.lab_id).filter((v) => v))]
		const patients = await newPatientModel.find(
			{ lab_id: { $in: labIds } },
			{ _id: 0, __v: 0 }
		)
		const specimens = await newSpecimenModel.find(
			{ lab_id: { $in: labIds } },
			{ _id: 0, __v: 0 }
		)
		const patientByLab = indexBy(patients, 'lab_id')
		const specimenByLab = indexBy(specimens, 'lab_id')

		// If no patient/specimen exists for a Lab ID, those columns stay blank —
		// never filled in from someone else's record.
		const report = data.map((d1) => {
			const merged = {
				...(patientByLab.get(d1.lab_id) || {}),
				...(specimenByLab.get(d1.lab_id) || {}),
				...d1._doc,
			}
			delete merged.__v
			return merged
		})

		const { data: arr, micro } = summariseAst(data)
		res.status(201).json({
			success: true,
			message: 'Fetched Monthly Report Successfully!',
			data: arr,
			micro,
			report,
		})
	} catch (error) {
		console.log(error)
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
