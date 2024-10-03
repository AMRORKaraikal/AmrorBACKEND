import { Schema, model } from 'mongoose'

/*
{ specimen_id, specimen_nature, specimen_source, collection_date, collection_time, illness_duration, specimen_collector, investigation_required, admission_date, physician_name }
*/

const specimenSchema = new Schema({
	location: {
		type: String,
		required: true,
	},
	clinical_ho: {
		type: String,
		required: true,
	},
	provisional_diagnosis: {
		type: String,
		required: true,
	},
	antibiotics_given: {
		type: String,
		required: true,
	},
	lab_id: {
		type: String,
		required: true,
	},

	specimen_nature: {
		type: String,
		required: true,
	},
	specimen_source: {
		type: String,
		required: true,
	},
	collection_date: {
		type: String,
		required: true,
	},
	collection_time: {
		type: String,
		required: true,
	},
	illness_duration: {
		type: String,
		required: true,
	},
	investigation_required: {
		type: String,
		required: true,
	},
	admission_date: {
		type: String,
		required: true,
	},
	physician_name: {
		type: String,
		required: true,
	},
})

const newSpecimenModel = model('newspecimen', specimenSchema)

export default newSpecimenModel
