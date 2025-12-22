"use client";

import { Meh } from "@/lib/assets/meh";
import calendar from "@/lib/assets/calendar.png";
import cycle_overview from "@/lib/assets/cycle_overview.png";
import cycle_log from "@/lib/assets/cycle_log.png";
import map from "@/lib/assets/map.png";
import { Wow } from "@/lib/assets/wow";
import { Think } from "@/lib/assets/think";

export default function Start() {
    return (
        <div className="container flex flex-col px-4 md:px-8 md:px-20">
            <div className="sm:h-160 grid sm:grid-cols-[1fr_auto] items-center gap-8 sm:gap-16 py-16 sm:py-0">
                <div className="flex sm:hidden justify-center">
                    <Meh className="h-50 sm:h-100" />
                </div>
                <div className="flex flex-col gap-8 text-center sm:text-start">
                    <h1 className="text-4xl sm:text-6xl font-bold">
                        Happy dating life with tons of memories to share.
                    </h1>
                    <div className="sm:text-2xl flex flex-col gap-1">
                        <div className="flex gap-2 items-baseline justify-center sm:justify-start">
                            Hello, welcome to{" "}
                            <p className="font-semibold text-xl sm:text-3xl">
                                Calple!
                            </p>
                        </div>
                        <p>
                            I will be your place to share, plan, and cherish
                            your special moments of your relationship.
                        </p>
                    </div>
                </div>
                <div className="hidden sm:flex justify-end">
                    <Meh className="h-50 sm:h-100" />
                </div>
            </div>

            <div className="grid sm:grid-cols-2 items-center gap-8 sm:gap-16 pb-16 sm:pb-32">
                <div className="sm:hidden bg-gradient-to-b from-pink-200 via-pink-100 to-background pt-4 px-4 rounded-t-xl">
                    <img
                        src={calendar.src}
                        alt="Calendar"
                        className="rounded-t-xl mask-b-from-70% mask-b-to-100%"
                    />
                </div>
                <div className="flex flex-col gap-4">
                    <p className="text-xl sm:text-4xl">
                        Separate your personal life from your professional life.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:text-lg">
                        I can be your sharable calendar only for you two,
                        designed to keep your personal life organized and
                        separate from your professional life.
                        <Wow className="w-52 h-auto" />
                    </div>
                </div>
                <div className="hidden sm:block bg-gradient-to-b from-pink-200 via-pink-100 to-background pt-4 px-4 rounded-t-xl">
                    <img
                        src={calendar.src}
                        alt="Calendar"
                        className="rounded-t-xl mask-b-from-70% mask-b-to-100%"
                    />
                </div>
            </div>

            <div className="grid sm:grid-cols-2 items-center pb-16 sm:pb-32 gap-8 sm:gap-16">
                <div className="bg-gradient-to-b from-blue-200 via-blue-100 p-4 rounded-t-xl">
                    <img
                        src={cycle_overview.src}
                        alt="Calendar"
                        className="rounded-t-xl mask-b-from-70% mask-b-to-100%"
                    />
                </div>
                <div className="flex flex-col gap-4">
                    <p className="text-xl sm:text-4xl">
                        Keep your family planning on track, sharing is
                        everything.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:text-lg">
                        I can track your cycle and help you plan ahead, keeping
                        your sexual life healthy is as important as anything!
                        Let's learn about sexual health and I will give you
                        advice, so you can share with your partner.
                    </div>
                </div>
                <div className="w-full flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex flex-col gap-4">
                        <p className="text-xl sm:text-4xl">Yours, only</p>
                        <p className="sm:text-lg">
                            I am simple and accurate, I'm here to help.
                            Customize to fit your needs. I will keep your
                            information private and secure, you can tell me
                            anything.
                        </p>
                    </div>
                    <div className="flex justify-center">
                        <Think className="w-52 h-auto" />
                    </div>
                </div>
                <div className="bg-gradient-to-t from-blue-200 via-blue-100 p-4 rounded-b-xl">
                    <img
                        src={cycle_log.src}
                        alt="Calendar"
                        className="rounded-b-xl mask-t-from-70% mask-t-to-100%"
                    />
                </div>
            </div>

            <div className="grid sm:grid-cols-2 items-center gap-8 sm:gap-16 pb-16 sm:pb-32">
                <div className="sm:hidden bg-gradient-to-b from-yellow-200 via-yellow-100 to-background pt-4 px-4 rounded-t-xl">
                    <img
                        src={map.src}
                        alt="Calendar"
                        className="rounded-t-xl mask-b-from-70% mask-b-to-100%"
                    />
                </div>
                <div className="flex flex-col gap-4">
                    <p className="text-xl sm:text-4xl">
                        Every moment matters, I can help you remember them all.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:text-lg">
                        I can be a map for you two, make pins for every special
                        moment you want to remember. I'll keep them safe and
                        easy to access whenever you want to cherish them.
                    </div>
                </div>
                <div className="hidden sm:block bg-gradient-to-b from-yellow-200 via-yellow-100 to-background pt-4 px-4 rounded-t-xl">
                    <img
                        src={map.src}
                        alt="Calendar"
                        className="rounded-t-xl mask-b-from-70% mask-b-to-100%"
                    />
                </div>
            </div>
        </div>
    );
}
