import { Schema, model } from 'mongoose'
// report_data = {
//             'patient_id': patient_id,
//             'specimen_id': specimen_id,
//             'direct_microscopic_examination': direct_microscopic_examination,
//             'culture_results': culture_results,
//             'ast': json_data,  # antimicrobial suspectibility testing result
//             'note': note,
//             'report_date': report_date,
//             'reporter_name': reporter_name,
//             'reporter_designation': reporter_designation,
//         }

const reportSchema = new Schema({
	lab_id: {
		type: String,
		required: true,
	},
	direct_microscopic_examination: {
		type: String,
	},
	culture_results: {
		type: String,
	},
	ast: {
		type: [Object],
		required: true,
	},
	comments: {
		type: String,
		required: false,
	},
	note: {
		type: String,
		required: false,
	},
	report_date: {
		type: Date,
		required: true,
	},
	reporter_name: {
		type: String,
		required: true,
	},
	reporter_designation: {
		type: String,
		required: true,
	},
	month: {
		type: String,
		required: true,
	},
	year: {
		type: Number,
		required: true,
	},
})

const newReportModel = model('newreport', reportSchema)

export default newReportModel
