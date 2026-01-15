"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchesProperty = MatchesProperty;
const class_validator_1 = require("class-validator");
function MatchesProperty(property, validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            name: 'matchesProperty',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(value, args) {
                    const [relatedPropertyName] = args.constraints;
                    const relatedValue = args.object[relatedPropertyName];
                    return value === relatedValue;
                },
                defaultMessage(args) {
                    const [relatedPropertyName] = args.constraints;
                    return `${args.property} must match ${relatedPropertyName}`;
                },
            },
        });
    };
}
//# sourceMappingURL=matches-property.js.map