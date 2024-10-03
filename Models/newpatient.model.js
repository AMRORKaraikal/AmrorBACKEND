import { Schema, model } from 'mongoose'
/*
{
        'hospital_id: '',
        'patient_name: '',
        'father_name: '',
        'village_name: '',
        'patient_age: '',
        'gender: '', patient_mobile: '',
        'location: '',
        'clinical_ho: '',
        'provisional_diagnosis: '',
        'antibiotics_given: ''
    }
*/
const patientSchema = new Schema({
	lab_id: {
		type: String,
		required: true,
	},

	patient_name: {
		type: String,
		required: true,
	},
	father_name: {
		type: String,
	},
	village_name: {
		type: String,
		required: true,
	},
	patient_age: {
		type: Number,
		required: true,
	},
	gender: {
		type: String,
		required: true,
	},
	patient_mobile: {
		type: Number,
		required: true,
	},
})

const newPatientModel = model('newpatient', patientSchema)

export default newPatientModel
