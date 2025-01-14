

import { Course, Unit } from '@prisma/client';
import slugify from 'slugify';

const titleToSlug = (title: string) => {
    const uriSlug = slugify(title, {
        replacement:'-',
        lower: true, 
        trim: true, 
    });

    return encodeURI(uriSlug);
};

const getCourseSlug = (course: Course) => {
    return `${titleToSlug(course.name)}-${course.id}`;
};

const getUnitSlug = (unit: Unit) => {
    return `${titleToSlug(unit.name)}-${unit.id}`;
};



export  { titleToSlug, getCourseSlug, getUnitSlug };