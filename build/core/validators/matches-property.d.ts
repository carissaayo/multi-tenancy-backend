import { ValidationOptions } from 'class-validator';
export declare function MatchesProperty(property: string, validationOptions?: ValidationOptions): (object: object, propertyName: string) => void;
