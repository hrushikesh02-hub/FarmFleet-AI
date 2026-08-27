const mongoose = require("mongoose");

const equipmentSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Owner",
            required: true,
        },

        name: {
            type: String,
            required: true,
        },

        type: {
            type: String,
            required: true,
        },

        pricePerAcre: {
            type: Number,
            default: 0,
        },

        pricePerDay: {
            type: Number,
            default: 0,
        },

        pricePerHour: {
            type: Number,
            default: 0,
        },

        pricingType: {
            type: String,
            enum: ["both", "daily", "acres"],
            default: "both",
        },

        location: {
            type: String,
            required: true,
        },

        coordinates: {
            lat: {
                type: Number,
                default: 0,
            },

            lng: {
                type: Number,
                default: 0,
            },
        },

        operatorIncluded: {
            type: Boolean,
            default: false,
        },

        image: {
            type: String,
            default: "",
        },

        status: {
            type: String,
            default: "Active",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "Equipment",
    equipmentSchema
);