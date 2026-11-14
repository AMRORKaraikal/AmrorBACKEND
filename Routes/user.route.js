import { Router } from 'express'
import userModel from '../Models/user.model.js'
import patientModel from '../Models/patient.model.js'
import specimenModel from '../Models/specimen.model.js'
import reportModel from '../Models/report.model.js'
import newSpecimenModel from '../Models/newspecimen.model.js'
import newPatientModel from '../Models/newpatient.model.js'
import newReportModel from '../Models/newreport.model.js'
const router = Router()

// Fields that make up a culture report's content. Two reports with the same
// values for all of these are the same report saved twice.
const REPORT_FIELDS = [
	'lab_id',
	'patient_id',
	'specimen_id',
	'direct_microscopic_examination',
	'culture_results',
	'ast',
	'comments',
	'note',
	'report_date',
	'reporter_name',
	'reporter_designation',
]
const reportKey = (r) =>
	JSON.stringify(
		REPORT_FIELDS.map((f) => {
			const v = r[f]
			if (v === undefined || v === null || v === '') return null
			if (f === 'report_date') return new Date(v).toISOString()
			return v
		})
	)

// Drop exact repeats (same report saved more than once), keeping the first.
// Nothing is deleted from the database.
const dedupeReports = (reports) => {
	const seen = new Set()
	return reports.filter((r) => {
		const k = reportKey(r._doc || r)
		if (seen.has(k)) return false
		seen.add(k)
		return true
	})
}

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

// Labels shown to the user when a required Request Form field is missing.
const FIELD_LABELS = {
	lab_id: 'Lab ID',
	patient_name: 'Patient Name',
	father_name: 'Father/Spouse Name',
	village_name: 'Village/Town',
	patient_age: 'Patient Age',
	gender: 'Gender',
	patient_mobile: 'Mobile Number',
	location: 'Location',
	clinical_ho: 'Clinical H/O',
	provisional_diagnosis: 'Provisional Diagnosis',
	antibiotics_given: 'Antibiotics Given',
	specimen_nature: 'Nature of Specimen',
	specimen_source: 'Specimen Source/Body site',
	collection_date: 'Date of collection',
	collection_time: 'Time of collection',
	illness_duration: 'Duration of illness',
	investigation_required: 'Investigation Required',
	admission_date: 'Date of admission',
	physician_name: 'Name of the Physician/Nurse',
}
const invalidFields = (Model, data) => {
	const err = new Model(data).validateSync()
	return err ? Object.keys(err.errors) : []
}

// Saves a Request Form: one patient record and one specimen record that share
// a Lab ID. Either both are saved or neither is.
const newSpecimenRegister = async (req, res, next) => {
	try {
		const patient_data = { ...(req.body.patient_data || {}) }
		const specimen_data = { ...(req.body.specimen_data || {}) }
		const lab_id =
			typeof patient_data.lab_id === 'string'
				? patient_data.lab_id.trim()
				: patient_data.lab_id
		patient_data.lab_id = lab_id
		specimen_data.lab_id = lab_id

		// Check both records before saving anything, so a missing specimen field
		// can no longer leave a patient saved without a specimen.
		const missing = [
			...new Set([
				...invalidFields(newPatientModel, patient_data),
				...invalidFields(newSpecimenModel, specimen_data),
			]),
		]
		if (missing.length > 0) {
			return res.status(400).json({
				success: false,
				message:
					'Please fill in: ' +
					missing.map((f) => FIELD_LABELS[f] || f).join(', '),
				missing,
			})
		}

		const existingPatient = await newPatientModel.findOne({ lab_id })
		const existingSpecimen = await newSpecimenModel.findOne({ lab_id })
		if (existingSpecimen) {
			return res.status(409).json({
				success: false,
				message: `Lab ID ${lab_id} is already registered. Nothing was saved. Check the Lab ID, or use a new one.`,
			})
		}

		if (existingPatient) {
			// Left over from an earlier attempt that saved the patient but not the
			// specimen: complete that registration with the details entered now.
			const { lab_id: _ignored, ...patientFields } = patient_data
			await newPatientModel.updateOne(
				{ _id: existingPatient._id },
				{ $set: patientFields },
				{ runValidators: true }
			)
			await newSpecimenModel.insertMany([specimen_data])
		} else {
			const [savedPatient] = await newPatientModel.insertMany([patient_data])
			try {
				await newSpecimenModel.insertMany([specimen_data])
			} catch (error) {
				// Undo the patient just saved so no half-registration is left behind.
				await newPatientModel.deleteOne({ _id: savedPatient._id })
				throw error
			}
		}

		res.status(201).json({
			success: true,
			message: 'Request Form saved.',
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
		if (!report_data.report_date || isNaN(today.getTime())) {
			return res.status(400).json({
				success: false,
				message: 'Please enter the report date.',
			})
		}
		// File the report under the month of its report date in Indian time.
		// (The server clock is UTC, where 1 November 00:00 IST is still 31 October.)
		report_data.month = new Intl.DateTimeFormat('en-US', {
			timeZone: 'Asia/Kolkata',
			month: 'long',
		}).format(today)
		report_data.year = Number(
			new Intl.DateTimeFormat('en-US', {
				timeZone: 'Asia/Kolkata',
				year: 'numeric',
			}).format(today)
		)

		// Ignore an exact repeat of a report that is already saved (e.g. Submit
		// pressed more than once). A different result for the same Lab ID is
		// still saved as a new report.
		const alreadySaved = await newReportModel.findOne({
			lab_id: report_data.lab_id,
			report_date: today,
			direct_microscopic_examination: report_data.direct_microscopic_examination,
			culture_results: report_data.culture_results,
		})
		if (
			alreadySaved &&
			reportKey(alreadySaved.toObject()) === reportKey(report_data)
		) {
			return res.status(201).json({
				success: true,
				message: 'Report already saved.',
			})
		}

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

		// Latest saved report for this Lab ID, so a corrected report replaces
		// the earlier one on the printout.
		let report = await newReportModel
			.findOne({ lab_id }, { _id: 0 })
			.sort({ _id: -1 })
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
		if (!patientData || !specimenData) {
			return res.status(404).json({
				success: false,
				message: patientData
					? `The Request Form for Lab ID ${lab_id} was not saved completely. Please enter the Request Form again.`
					: `No Request Form found for Lab ID ${lab_id}.`,
			})
		}
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
			// Disc diffusion result, or the MIC interpretation when only MIC was done
			const outcome = element.Result || element.Mic_result || ''
			if (entry.Antibiotics[anti]) {
				entry.Antibiotics[anti].push(outcome)
			} else {
				entry.Antibiotics[anti] = [outcome]
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
		const data = dedupeReports(
			await reportModel.find({ month, year }, { _id: 0, __v: 0 })
		)

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
		const data = dedupeReports(
			await newReportModel.find({ month, year }, { _id: 0, __v: 0 })
		)

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
