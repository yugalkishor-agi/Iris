import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "./input";
import { Button } from "./button";

// Emoji database with searchable keywords
const emojiData = {
  "😀": ["grinning", "smile", "happy"],
  "😃": ["smiley", "smile", "happy"],
  "😄": ["smile", "happy", "joy"],
  "😁": ["grin", "smile", "happy"],
  "😆": ["laughing", "satisfied", "happy"],
  "😅": ["sweat", "smile", "relief"],
  "🤣": ["rofl", "laughing", "lol"],
  "😂": ["joy", "tears", "laughing"],
  "🙂": ["smile", "happy"],
  "🙃": ["upside", "down", "silly"],
  "😉": ["wink", "flirt"],
  "😊": ["blush", "smile", "happy"],
  "😇": ["angel", "innocent", "halo"],
  "🥰": ["love", "hearts", "adore"],
  "😍": ["heart", "eyes", "love"],
  "🤩": ["star", "eyes", "excited"],
  "😘": ["kiss", "love", "heart"],
  "❤️": ["heart", "love", "red"],
  "💕": ["hearts", "love", "pink"],
  "💯": ["hundred", "perfect", "score"],
  "🔥": ["fire", "hot", "lit"],
  "✨": ["sparkles", "shine", "magic"],
  "🎉": ["party", "celebrate", "confetti"],
  "👍": ["thumbs", "up", "like", "yes"],
  "👎": ["thumbs", "down", "dislike", "no"],
  "👏": ["clap", "applause", "praise"],
  "🙏": ["pray", "thanks", "please"],
  "💪": ["muscle", "strong", "flex"],
  "🤔": ["thinking", "hmm", "wonder"],
  "😭": ["crying", "tears", "sad"],
  "😢": ["cry", "sad", "tear"],
  "😡": ["angry", "mad", "rage"],
  "😱": ["scream", "shocked", "scared"],
  "🤗": ["hug", "embrace"],
  "🤭": ["giggle", "oops", "shy"],
  "🥺": ["pleading", "puppy", "eyes"],
  "😴": ["sleep", "tired", "zzz"],
  "🤤": ["drool", "hungry"],
  "🤢": ["sick", "nauseous", "ill"],
  "🥳": ["party", "celebrate", "hat"],
  "😎": ["cool", "sunglasses"],
  "🤓": ["nerd", "geek", "glasses"],
  "🐶": ["dog", "puppy", "pet"],
  "🐱": ["cat", "kitty", "pet"],
  "🦊": ["fox", "animal"],
  "🐻": ["bear", "animal"],
  "🐼": ["panda", "bear"],
  "🦁": ["lion", "king", "animal"],
  "🐯": ["tiger", "animal"],
  "🐸": ["frog", "animal"],
  "🐵": ["monkey", "animal"],
  "🦄": ["unicorn", "magic", "fantasy"],
  "🐝": ["bee", "honey", "insect"],
  "🦋": ["butterfly", "insect"],
  "🌸": ["flower", "blossom", "pink"],
  "🌹": ["rose", "flower", "red"],
  "🌺": ["hibiscus", "flower"],
  "🌻": ["sunflower", "flower", "yellow"],
  "🌼": ["daisy", "flower"],
  "🌷": ["tulip", "flower"],
  "🍕": ["pizza", "food"],
  "🍔": ["burger", "food", "hamburger"],
  "🍟": ["fries", "food", "french"],
  "🌭": ["hotdog", "food"],
  "🍿": ["popcorn", "snack", "movie"],
  "🍩": ["donut", "doughnut", "sweet"],
  "🍪": ["cookie", "sweet", "snack"],
  "🎂": ["cake", "birthday", "dessert"],
  "🍰": ["cake", "slice", "dessert"],
  "🍫": ["chocolate", "sweet", "candy"],
  "🍬": ["candy", "sweet"],
  "🍭": ["lollipop", "candy", "sweet"],
  "☕": ["coffee", "drink", "hot"],
  "🍵": ["tea", "drink", "hot"],
  "🥤": ["drink", "soda", "cup"],
  "🍺": ["beer", "drink", "alcohol"],
  "🍻": ["beers", "cheers", "drink"],
  "🍷": ["wine", "drink", "alcohol"],
  "⚽": ["soccer", "football", "ball", "sport"],
  "🏀": ["basketball", "ball", "sport"],
  "🏈": ["football", "american", "sport"],
  "⚾": ["baseball", "ball", "sport"],
  "🎾": ["tennis", "ball", "sport"],
  "🏐": ["volleyball", "ball", "sport"],
  "🏆": ["trophy", "win", "award"],
  "🥇": ["gold", "medal", "first"],
  "🥈": ["silver", "medal", "second"],
  "🥉": ["bronze", "medal", "third"],
  "🎮": ["game", "controller", "gaming"],
  "🎯": ["target", "dart", "bullseye"],
  "🎲": ["dice", "game"],
  "🎨": ["art", "paint", "palette"],
  "🎭": ["theater", "drama", "masks"],
  "🎪": ["circus", "tent"],
  "🎬": ["movie", "film", "clapper"],
  "🎤": ["microphone", "sing", "karaoke"],
  "🎧": ["headphones", "music"],
  "🎸": ["guitar", "music", "rock"],
  "🎹": ["piano", "keyboard", "music"],
  "🥁": ["drum", "music"],
  "🚗": ["car", "vehicle", "auto"],
  "🚕": ["taxi", "cab", "vehicle"],
  "🚙": ["suv", "car", "vehicle"],
  "🚌": ["bus", "vehicle"],
  "🚎": ["trolley", "bus", "vehicle"],
  "🏎️": ["race", "car", "fast"],
  "🚓": ["police", "car", "cop"],
  "🚑": ["ambulance", "emergency"],
  "🚒": ["fire", "truck", "emergency"],
  "🚚": ["truck", "delivery"],
  "🚛": ["truck", "semi"],
  "🚜": ["tractor", "farm"],
  "🚲": ["bike", "bicycle", "cycle"],
  "🛵": ["scooter", "moped"],
  "🏍️": ["motorcycle", "bike"],
  "✈️": ["airplane", "plane", "flight"],
  "🚁": ["helicopter", "chopper"],
  "🚀": ["rocket", "space", "launch"],
  "🛸": ["ufo", "alien", "spaceship"],
  "⛵": ["sailboat", "boat", "sail"],
  "🚤": ["speedboat", "boat"],
  "⚓": ["anchor", "ship", "boat"],
  "🏠": ["house", "home"],
  "🏡": ["house", "home", "garden"],
  "🏢": ["office", "building"],
  "🏥": ["hospital", "medical"],
  "🏦": ["bank", "money"],
  "🏨": ["hotel", "building"],
  "🏪": ["store", "shop", "convenience"],
  "🏫": ["school", "education"],
  "⌚": ["watch", "time"],
  "📱": ["phone", "mobile", "iphone"],
  "💻": ["laptop", "computer"],
  "⌨️": ["keyboard", "typing"],
  "🖥️": ["computer", "desktop", "monitor"],
  "🖨️": ["printer", "print"],
  "📷": ["camera", "photo"],
  "📸": ["camera", "flash", "photo"],
  "📹": ["video", "camera"],
  "📺": ["tv", "television"],
  "📻": ["radio", "music"],
  "🔋": ["battery", "power"],
  "💡": ["bulb", "light", "idea"],
  "🔦": ["flashlight", "torch"],
  "💰": ["money", "bag", "cash"],
  "💵": ["dollar", "money", "bill"],
  "💳": ["card", "credit", "payment"],
  "💎": ["diamond", "gem", "jewel"],
  "🔑": ["key", "lock"],
  "🔨": ["hammer", "tool"],
  "🔧": ["wrench", "tool"],
  "🔩": ["nut", "bolt"],
  "⚙️": ["gear", "settings"],
  "🔫": ["gun", "pistol", "weapon"],
  "💣": ["bomb", "explosive"],
  "🔪": ["knife", "blade"],
  "🗡️": ["sword", "blade", "weapon"],
  "🛡️": ["shield", "protection"],
  "🚬": ["cigarette", "smoke"],
  "💊": ["pill", "medicine", "drug"],
  "💉": ["syringe", "needle", "shot"],
  "🩹": ["bandage", "bandaid"],
  "🌡️": ["thermometer", "temperature"],
  "🧹": ["broom", "sweep", "clean"],
  "🧺": ["basket", "laundry"],
  "🧻": ["toilet", "paper"],
  "🚽": ["toilet", "bathroom"],
  "🚿": ["shower", "bath"],
  "🛁": ["bathtub", "bath"],
  "🧼": ["soap", "clean"],
  "🪒": ["razor", "shave"],
  "🧴": ["lotion", "bottle"],
  "🔔": ["bell", "notification", "ring"],
  "🔕": ["bell", "mute", "silent"],
  "📢": ["loudspeaker", "announcement"],
  "📣": ["megaphone", "cheer"],
  "📯": ["horn", "trumpet"],
  "🎺": ["trumpet", "music"],
  "🎷": ["saxophone", "music"],
  "🎻": ["violin", "music"],
  "📖": ["book", "read", "open"],
  "📚": ["books", "library", "study"],
  "📝": ["memo", "note", "write"],
  "✏️": ["pencil", "write"],
  "✒️": ["pen", "write"],
  "🖊️": ["pen", "write"],
  "🖍️": ["crayon", "draw"],
  "📍": ["pin", "location"],
  "✂️": ["scissors", "cut"],
  "🗂️": ["folder", "files"],
  "📁": ["folder", "file"],
  "📂": ["folder", "open", "file"],
  "🗃️": ["cabinet", "file"],
  "📅": ["calendar", "date"],
  "📆": ["calendar", "date"],
  "🗓️": ["calendar", "date"],
  "📇": ["card", "index"],
  "📈": ["chart", "up", "growth"],
  "📉": ["chart", "down", "decline"],
  "📊": ["chart", "bar", "graph"],
  "📋": ["clipboard", "list"],
  "📎": ["paperclip", "clip"],
  "🔗": ["link", "chain"],
  "📧": ["email", "mail"],
  "📨": ["envelope", "mail", "incoming"],
  "📩": ["envelope", "mail", "arrow"],
  "📤": ["outbox", "mail", "send"],
  "📥": ["inbox", "mail", "receive"],
  "📦": ["package", "box", "parcel"],
  "📫": ["mailbox", "mail"],
  "📪": ["mailbox", "mail", "closed"],
  "📬": ["mailbox", "mail", "open"],
  "📭": ["mailbox", "mail", "open"],
  "🏳️": ["flag", "white"],
  "🏴": ["flag", "black"],
  "🏁": ["flag", "checkered", "race"],
  "🚩": ["flag", "red", "warning"],
  "🎌": ["flags", "crossed"],
  "🏳️‍🌈": ["rainbow", "flag", "pride", "lgbt"],
  "❤️‍🔥": ["heart", "fire", "love", "passion"],
  "💔": ["broken", "heart", "sad"],
  "❣️": ["heart", "exclamation"],
  "💘": ["heart", "arrow", "cupid"],
  "💝": ["heart", "gift", "love"],
  "💖": ["heart", "sparkle", "love"],
  "💗": ["heart", "growing", "love"],
  "💓": ["heart", "beating", "love"],
  "💞": ["hearts", "revolving", "love"],
  "✅": ["check", "yes", "done", "correct"],
  "❌": ["x", "no", "cross", "wrong"],
  "⭕": ["circle", "o", "hollow"],
  "❗": ["exclamation", "mark", "important"],
  "❓": ["question", "mark", "help"],
  "⚠️": ["warning", "caution", "alert"],
  "🚫": ["prohibited", "no", "ban"],
  "⛔": ["no", "entry", "stop"],
  "🔞": ["eighteen", "adult", "nsfw"],
  "🔰": ["beginner", "japanese"],
  "♻️": ["recycle", "green", "eco"],
  "✳️": ["asterisk", "star"],
  "✴️": ["star", "eight"],
  "❇️": ["sparkle", "star"],
  "🆕": ["new", "badge"],
  "🆓": ["free", "badge"],
  "🆙": ["up", "badge"],
  "🆗": ["ok", "badge"],
  "🆒": ["cool", "badge"],
  "🆘": ["sos", "help", "emergency"],
  "🅰️": ["a", "blood", "type"],
  "🅱️": ["b", "blood", "type"],
  "🅾️": ["o", "blood", "type"],
  "🆎": ["ab", "blood", "type"],
  "🔴": ["red", "circle"],
  "🟠": ["orange", "circle"],
  "🟡": ["yellow", "circle"],
  "🟢": ["green", "circle"],
  "🔵": ["blue", "circle"],
  "🟣": ["purple", "circle"],
  "🟤": ["brown", "circle"],
  "⚫": ["black", "circle"],
  "⚪": ["white", "circle"],
  "🟥": ["red", "square"],
  "🟧": ["orange", "square"],
  "🟨": ["yellow", "square"],
  "🟩": ["green", "square"],
  "🟦": ["blue", "square"],
  "🟪": ["purple", "square"],
  "🟫": ["brown", "square"],
  "⬛": ["black", "square"],
  "⬜": ["white", "square"],
};

// Comprehensive emoji database organized by category
const emojiCategories = {
  "Smileys & People": [
    "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇",
    "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😝",
    "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄",
    "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧",
    "🥵", "🥶", "😶‍🌫️", "🥴", "😵", "🤯", "🤠", "🥳", "🥸", "😎", "🤓", "🧐",
    "😕", "😟", "🙁", "☹️", "😮", "😯", "😲", "😳", "🥺", "😦", "😧", "😨", "😰",
    "😥", "😢", "😭", "😱", "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😤", "😡",
    "😠", "🤬", "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟",
    "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛",
    "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "💪", "❤️", "🧡", "💛", "💚", "💙",
    "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "💕", "💞", "💓", "💗", "💖", "💘",
    "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐"
  ],
  "Animals & Nature": [
    "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷",
    "🐽", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦", "🐤", "🐣", "🐥",
    "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞",
    "🐜", "🦟", "🦗", "🕷️", "🕸️", "🦂", "🐢", "🐍", "🦎", "🦖", "🦕", "🐙", "🦑",
    "🦐", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🐋", "🦈", "🐊", "🐅", "🐆",
    "🦓", "🦍", "🦧", "🐘", "🦛", "🦏", "🐪", "🐫", "🦒", "🦘", "🐃", "🐂", "🐄",
    "🐎", "🐖", "🐏", "🐑", "🦙", "🐐", "🦌", "🐕", "🐩", "🦮", "🐕‍🦺", "🐈", "🐈‍⬛",
    "🐓", "🦃", "🦚", "🦜", "🦢", "🦩", "🕊️", "🐇", "🦝", "🦨", "🦡", "🦦", "🦥",
    "🐁", "🐀", "🐿️", "🦔", "💐", "🌸", "💮", "🏵️", "🌹", "🥀", "🌺", "🌻", "🌼",
    "🌷", "🌱", "🌲", "🌳", "🌴", "🌵", "🌾", "🌿", "☘️", "🍀", "🍁", "🍂", "🍃"
  ],
  "Food & Drink": [
    "🍇", "🍈", "🍉", "🍊", "🍋", "🍌", "🍍", "🥭", "🍎", "🍏", "🍐", "🍑", "🍒",
    "🍓", "🫐", "🥝", "🍅", "🫒", "🥥", "🥑", "🍆", "🥔", "🥕", "🌽", "🌶️", "🫑",
    "🥒", "🥬", "🥦", "🧄", "🧅", "🍄", "🥜", "🌰", "🍞", "🥐", "🥖", "🫓", "🥨",
    "🥯", "🥞", "🧇", "🧀", "🍖", "🍗", "🥩", "🥓", "🍔", "🍟", "🍕", "🌭", "🥪",
    "🌮", "🌯", "🫔", "🥙", "🧆", "🥚", "🍳", "🥘", "🍲", "🫕", "🥣", "🥗", "🍿",
    "🧈", "🧂", "🥫", "🍱", "🍘", "🍙", "🍚", "🍛", "🍜", "🍝", "🍠", "🍢", "🍣",
    "🍤", "🍥", "🥮", "🍡", "🥟", "🥠", "🥡", "🦀", "🦞", "🦐", "🦑", "🦪", "🍦",
    "🍧", "🍨", "🍩", "🍪", "🎂", "🍰", "🧁", "🥧", "🍫", "🍬", "🍭", "🍮", "🍯",
    "🍼", "🥛", "☕", "🫖", "🍵", "🍶", "🍾", "🍷", "🍸", "🍹", "🍺", "🍻", "🥂",
    "🥃", "🥤", "🧋", "🧃", "🧉", "🧊"
  ],
  "Activities & Sports": [
    "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸",
    "🏒", "🏑", "🥍", "🏏", "🪃", "🥅", "⛳", "🪁", "🏹", "🎣", "🤿", "🥊", "🥋",
    "🎽", "🛹", "🛼", "🛷", "⛸️", "🥌", "🎿", "⛷️", "🏂", "🪂", "🏋️", "🤼", "🤸",
    "🤺", "🤾", "🏌️", "🏇", "🧘", "🏊", "🤽", "🚣", "🧗", "🚵", "🚴", "🏆", "🥇",
    "🥈", "🥉", "🏅", "🎖️", "🏵️", "🎗️", "🎫", "🎟️", "🎪", "🤹", "🎭", "🩰", "🎨",
    "🎬", "🎤", "🎧", "🎼", "🎹", "🥁", "🪘", "🎷", "🎺", "🪗", "🎸", "🪕", "🎻",
    "🎲", "♟️", "🎯", "🎳", "🎮", "🎰", "🧩"
  ],
  "Travel & Places": [
    "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🚛",
    "🚜", "🦯", "🦽", "🦼", "🛴", "🚲", "🛵", "🏍️", "🛺", "🚨", "🚔", "🚍", "🚘",
    "🚖", "🚡", "🚠", "🚟", "🚃", "🚋", "🚞", "🚝", "🚄", "🚅", "🚈", "🚂", "🚆",
    "🚇", "🚊", "🚉", "✈️", "🛫", "🛬", "🛩️", "💺", "🛰️", "🚀", "🛸", "🚁", "🛶",
    "⛵", "🚤", "🛥️", "🛳️", "⛴️", "🚢", "⚓", "⛽", "🚧", "🚦", "🚥", "🚏", "🗺️",
    "🗿", "🗽", "🗼", "🏰", "🏯", "🏟️", "🎡", "🎢", "🎠", "⛲", "⛱️", "🏖️", "🏝️",
    "🏜️", "🌋", "⛰️", "🏔️", "🗻", "🏕️", "⛺", "🛖", "🏠", "🏡", "🏘️", "🏚️", "🏗️",
    "🏭", "🏢", "🏬", "🏣", "🏤", "🏥", "🏦", "🏨", "🏪", "🏫", "🏩", "💒", "🏛️",
    "⛪", "🕌", "🕍", "🛕", "🕋", "⛩️", "🛤️", "🛣️", "🗾", "🎑", "🏞️", "🌅", "🌄",
    "🌠", "🎇", "🎆", "🌇", "🌆", "🏙️", "🌃", "🌌", "🌉", "🌁"
  ],
  "Objects": [
    "⌚", "📱", "📲", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️", "🕹️", "🗜️", "💽", "💾",
    "💿", "📀", "📼", "📷", "📸", "📹", "🎥", "📽️", "🎞️", "📞", "☎️", "📟", "📠",
    "📺", "📻", "🎙️", "🎚️", "🎛️", "🧭", "⏱️", "⏲️", "⏰", "🕰️", "⌛", "⏳", "📡",
    "🔋", "🔌", "💡", "🔦", "🕯️", "🪔", "🧯", "🛢️", "💸", "💵", "💴", "💶", "💷",
    "🪙", "💰", "💳", "💎", "⚖️", "🪜", "🧰", "🪛", "🔧", "🔨", "⚒️", "🛠️", "⛏️",
    "🪚", "🔩", "⚙️", "🪤", "🧱", "⛓️", "🧲", "🔫", "💣", "🧨", "🪓", "🔪", "🗡️",
    "⚔️", "🛡️", "🚬", "⚰️", "🪦", "⚱️", "🏺", "🔮", "📿", "🧿", "💈", "⚗️", "🔭",
    "🔬", "🕳️", "🩹", "🩺", "💊", "💉", "🩸", "🧬", "🦠", "🧫", "🧪", "🌡️", "🧹",
    "🪠", "🧺", "🧻", "🚽", "🚰", "🚿", "🛁", "🛀", "🧼", "🪒", "🧽", "🪥", "🧴",
    "🛎️", "🔑", "🗝️", "🚪", "🪑", "🛋️", "🛏️", "🛌", "🧸", "🪆", "🖼️", "🪞", "🪟"
  ],
  "Symbols": [
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞",
    "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯",
    "🕎", "☯️", "☦️", "🛐", "⛎", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐",
    "♑", "♒", "♓", "🆔", "⚛️", "🉑", "☢️", "☣️", "📴", "📳", "🈶", "🈚", "🈸",
    "🈺", "🈷️", "✴️", "🆚", "💮", "🉐", "㊙️", "㊗️", "🈴", "🈵", "🈹", "🈲", "🅰️",
    "🅱️", "🆎", "🆑", "🅾️", "🆘", "❌", "⭕", "🛑", "⛔", "📛", "🚫", "💯", "💢",
    "♨️", "🚷", "🚯", "🚳", "🚱", "🔞", "📵", "🚭", "❗", "❕", "❓", "❔", "‼️",
    "⁉️", "🔅", "🔆", "〽️", "⚠️", "🚸", "🔱", "⚜️", "🔰", "♻️", "✅", "🈯", "💹",
    "❇️", "✳️", "❎", "🌐", "💠", "Ⓜ️", "🌀", "💤", "🏧", "🚾", "♿", "🅿️", "🛗",
    "🈳", "🈂️", "🛂", "🛃", "🛄", "🛅", "🚹", "🚺", "🚼", "⚧️", "🚻", "🚮", "🎦"
  ],
  "Flags": [
    "🏁", "🚩", "🎌", "🏴", "🏳️", "🏳️‍🌈", "🏳️‍⚧️", "🏴‍☠️", "🇦🇫", "🇦🇽", "🇦🇱", "🇩🇿",
    "🇦🇸", "🇦🇩", "🇦🇴", "🇦🇮", "🇦🇶", "🇦🇬", "🇦🇷", "🇦🇲", "🇦🇼", "🇦🇺", "🇦🇹", "🇦🇿",
    "🇧🇸", "🇧🇭", "🇧🇩", "🇧🇧", "🇧🇾", "🇧🇪", "🇧🇿", "🇧🇯", "🇧🇲", "🇧🇹", "🇧🇴", "🇧🇦",
    "🇧🇼", "🇧🇷", "🇮🇴", "🇻🇬", "🇧🇳", "🇧🇬", "🇧🇫", "🇧🇮", "🇰🇭", "🇨🇲", "🇨🇦", "🇮🇨",
    "🇨🇻", "🇧🇶", "🇰🇾", "🇨🇫", "🇹🇩", "🇨🇱", "🇨🇳", "🇨🇽", "🇨🇨", "🇨🇴", "🇰🇲", "🇨🇬",
    "🇨🇩", "🇨🇰", "🇨🇷", "🇨🇮", "🇭🇷", "🇨🇺", "🇨🇼", "🇨🇾", "🇨🇿", "🇩🇰", "🇩🇯", "🇩🇲",
    "🇩🇴", "🇪🇨", "🇪🇬", "🇸🇻", "🇬🇶", "🇪🇷", "🇪🇪", "🇪🇹", "🇪🇺", "🇫🇰", "🇫🇴", "🇫🇯",
    "🇫🇮", "🇫🇷", "🇬🇫", "🇵🇫", "🇹🇫", "🇬🇦", "🇬🇲", "🇬🇪", "🇩🇪", "🇬🇭", "🇬🇮", "🇬🇷",
    "🇬🇱", "🇬🇩", "🇬🇵", "🇬🇺", "🇬🇹", "🇬🇬", "🇬🇳", "🇬🇼", "🇬🇾", "🇭🇹", "🇭🇳", "🇭🇰",
    "🇭🇺", "🇮🇸", "🇮🇳", "🇮🇩", "🇮🇷", "🇮🇶", "🇮🇪", "🇮🇲", "🇮🇱", "🇮🇹", "🇯🇲", "🇯🇵"
  ]
};

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onEmojiSelect, onClose }: EmojiPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Smileys & People");
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Filter emojis based on search
  const getFilteredEmojis = () => {
    if (!searchQuery) {
      return emojiCategories[selectedCategory as keyof typeof emojiCategories] || [];
    }

    // Search by keywords
    const query = searchQuery.toLowerCase().trim();
    const results: string[] = [];
    
    Object.entries(emojiData).forEach(([emoji, keywords]) => {
      if (keywords.some(keyword => keyword.includes(query))) {
        results.push(emoji);
      }
    });
    
    // If no results from keyword search, show all emojis
    return results.length > 0 ? results : Object.values(emojiCategories).flat();
  };

  const filteredEmojis = getFilteredEmojis();

  return (
    <div
      ref={pickerRef}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm bg-background border rounded-2xl shadow-2xl z-50 overflow-hidden"
    >
      {/* Search Bar */}
      <div className="p-3 border-b bg-muted/30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search emojis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 rounded-full bg-background"
          />
          {searchQuery && (
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      {!searchQuery && (
        <div className="flex gap-1 px-3 py-2 border-b overflow-x-auto scrollbar-hide bg-muted/20">
          {Object.keys(emojiCategories).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors flex-shrink-0 ${
                selectedCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted text-muted-foreground"
              }`}
            >
              {category.split(" & ")[0]}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="h-72 overflow-y-auto p-3">
        <div className="grid grid-cols-8 gap-2">
          {filteredEmojis.map((emoji, index) => (
            <button
              key={`${emoji}-${index}`}
              onClick={() => {
                onEmojiSelect(emoji);
                onClose();
              }}
              className="aspect-square flex items-center justify-center text-2xl hover:bg-accent rounded-lg transition-colors active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>
        {filteredEmojis.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No emojis found
          </div>
        )}
      </div>
    </div>
  );
}
