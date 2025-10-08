import React from "react";

const HowItWokrs = () => {

    const steps = [
        {number: 1, title: "Enter", description: "Login, and click to enter arena and start your coding journey", color: "bg-purple-100", textColor: "text-purple-600"},
        { number: 2, title: 'CHOOSE', description: 'Select your preferred category or coding mode', color: 'bg-pink-100', textColor: 'text-pink-500' },
        { number: 3, title: 'MATCH', description: 'Get paired with an opponent', color: 'bg-yellow-100', textColor: 'text-yellow-500' },
        { number: 4, title: 'WIN', description: 'Code faster and smarter', color: 'bg-blue-100', textColor: 'text-blue-500' },
    ];

    return (
        <section id="how-it-works" className="py-20 px-4 bg-gradient-to-tr from-black to-gray-900">
            <div className="max-w-6xl mx-auto"> 
                <div className="text-center mb-16">
                    <h1 className="font-bold text-white text-4xl mb-3">HOW IT WORKS</h1>
                    <p className="text-gray-600 max-w-2xl mx-auto">Join a coding battle in just 4 simple steps</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                    {steps.map((step, index) => (
                        <div key={index} className="text-center">
                            <div className={`${step.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce`} style={{ animationDuration: "2s" }}>
                                <span className={`font-bold text-2xl ${step.textColor}`}>{step.number}</span>
                            </div>
                            <p className="text-gray-500 text-xl">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default HowItWokrs;