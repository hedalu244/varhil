namespace animations {
    function ease(startPos: number, endPos: number, delay: number, duration: number, current: number): number {
        const rate = Math.max(0, Math.min(1, (current - delay) / duration));
        return startPos + (endPos - startPos) * (rate * rate * (3 - 2 * rate));
    };

    function drawsvg(svg: SVGSVGElement) {
        const duration = 1000;
        const stagger = 200;
        const paths = Array.from(svg.getElementsByTagName("path")).map((element, i) => ({
            element,
            delay: i * stagger,
            length: element.getTotalLength()
        }));
        paths.forEach((path, i) => {
            path.element.style.strokeDasharray = [path.length, path.length].join(" ");
        });

        const begin = performance.now();
        const totalDuration = stagger * paths.length + duration;
        update();

        function update() {
            const current = performance.now() - begin;
            paths.forEach((path, i) => {
                path.element.style.strokeDashoffset = ease(path.length, 0, path.delay, duration, current) + "";
            });
            if (current < totalDuration) requestAnimationFrame(update);
        }
    }

    function assure<T extends new (...args: any[]) => any>(a: any, b: T): InstanceType<T> {
        if (a instanceof b) return a;
        throw new TypeError(`${a} is not ${b.name}.`);
    }

    export function shortHomeAnimation(): void {
        const animation = assure(document.getElementById("animation"), SVGSVGElement);
        const logo = assure(document.getElementById("logo"), HTMLElement);
        const content = assure(document.getElementById("content"), HTMLElement);

        const begin = performance.now();
        update();
        function update() {
            const current = performance.now() - begin;

            animation.style.opacity = ease(0, 1, 0, 600, current) + "";
            logo.style.opacity = ease(0, 1, 200, 400, current) + "";
            content.style.opacity = ease(0, 1, 400, 400, current) + "";

            if (current < 800) requestAnimationFrame(update);
        }
        /*
        animation.animate({ opacity: 1 }, { duration: 600, easing: 'ease-in-out' });
        setTimeout(() => animation.style.opacity = "1", 600);

        setTimeout(() => logo.animate({ opacity: 1 }, { duration: 400, easing: 'ease-in-out' }), 200);
        setTimeout(() => logo.style.opacity = "1", 600);

        setTimeout(() => content.animate({ opacity: 1 }, { duration: 400, easing: 'ease-in-out' }), 400);
        setTimeout(() => content.style.opacity = "1", 800);
        */
    }

    export function longHomeAnimation(): void {// スクロール禁止
        function forbid_scroll() {
            document.addEventListener("mousewheel", killWheel, { passive: false });
            document.addEventListener("touchmove", killTouch, { passive: false });
            document.addEventListener("keydown", killArrowKey, { passive: false });
            document.body.style.overflow = "hidden";
        }
        // スクロール禁止解除
        function permit_scroll() {
            document.removeEventListener("mousewheel", killWheel);
            document.removeEventListener('touchmove', killTouch);
            document.removeEventListener("keydown", killArrowKey);
            document.body.style.overflow = "visible";
        }
        function killWheel(event: Event) {
            event.preventDefault();
        }
        function killTouch(event: Event) {
            event.preventDefault();
        }
        function killArrowKey(event: KeyboardEvent) {
            console.log(event.key);
            switch (event.key) {
                case "ArrowLeft":
                case "ArrowRight":
                case "ArrowDown":
                case "ArrowUp":
                    event.preventDefault();
                    break;
            }
        }
        const animation = assure(document.getElementById("animation"), SVGSVGElement);
        const logo = assure(document.getElementById("logo"), HTMLElement);
        const keyVisual = assure(document.getElementById("key-visual"), HTMLElement);
        const content = assure(document.getElementById("content"), HTMLElement);

        scrollTo(0, 0);
        forbid_scroll();
        setTimeout(permit_scroll, 2700);

        animation.style.opacity = "1";
        drawsvg(animation);

        const begin = performance.now();
        update();
        function update() {
            const current = performance.now() - begin;

            logo.style.opacity = ease(0, 1, 2300, 400, current) + "";
            keyVisual.style.marginTop = ease((window.innerHeight - keyVisual.getBoundingClientRect().height) / 2, 0, 2700, 600, current) + "px";
            content.style.opacity = ease(0, 1, 3000, 400, current) + "";

            if (current < 3400) requestAnimationFrame(update);
        }

        /*
        keyVisual.style.marginTop = ((window.innerHeight - keyVisual.getBoundingClientRect().height) / 2) + "px";

        setTimeout(() => logo.animate({ opacity: 1 }, { duration: 400, easing: 'ease-in-out' }), 2300);
        setTimeout(() => logo.style.opacity = "1", 2700);

        setTimeout(() => keyVisual.animate({ "marginTop": "0px" }, { duration: 600, easing: 'ease-in-out' }), 2700);
        setTimeout(() => keyVisual.style.marginTop = "0", 3300);

        setTimeout(() => content.animate({ opacity: 1 }, { duration: 400, easing: 'ease-in-out' }), 3000);
        setTimeout(() => content.style.opacity = "1", 3400);
        */
    }

    export function pageAnimation() {
        const content = assure(document.getElementById("content"), HTMLElement);

        const begin = performance.now();
        update();
        function update() {
            const current = performance.now() - begin;
            content.style.opacity = ease(0, 1, 0, 400, current) + "";

            if (current < 400) requestAnimationFrame(update);
        }

        /*
        content.animate({ opacity: 1 }, { duration: 400, easing: 'ease-in-out' });
        setTimeout(() => content.style.opacity = "1", 400);
        */
    }
}