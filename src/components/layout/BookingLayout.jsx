import React from 'react';
import { Outlet } from 'react-router-dom';
import StepProgress from '../booking-flow/StepProgress';

export default function BookingLayout() {
    return (
        <div>
            <div>Agendly</div>
            <main>
                <StepProgress />
                <Outlet />
            </main>
        </div>
    );
}