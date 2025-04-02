import React from 'react';

export const AnimatedTitle = () => {
    return (
        <h1 className="text-2xl font-bold relative overflow-hidden py-1">
            <span className="relative inline-block animate-float text-white">
                Расписание
            </span>
            <span className="relative inline-block animate-float-delayed ml-2 text-white/90">
                учителя
            </span>
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-white/40 via-white/80 to-white/40 transform origin-left animate-line"></div>
        </h1>
    );
}; 