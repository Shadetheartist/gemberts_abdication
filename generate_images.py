import json
import os
import subprocess
from PIL import Image

symbols_replace = {
'_honey': '🍯',
'_clay': '🪨',
'_larvae': '🐛',
'_defence': '🛡',
'_combatpower': '⚔️',
'_production': '⚒️',
'_x': '×',
'_d1': '⚀',
'_d2': '⚁',
'_d3': '⚂',
'_d4': '⚃',
'_d5': '⚄',
'_d6': '⚅',
}


def replace_symbols(str):
    for symbol in symbols_replace:
        replace = symbols_replace[symbol]
        str = str.replace(symbol, replace)
    return str


def cost_str(cost):
    strs = []

    for c in cost: 
        symbol_key = '_' + c
        amount = cost[c]
        s = symbol_key + '_x' + str(amount)
        strs.append(s)

    s = ', '.join(strs)

    return s

def art_path_from_name(name):
    name = name.replace(' ', '_')
    name = name.lower()
    path = f'./art/{name}.png'
    return path


def create_spritesheet(filenames, sheet_dimensions=(10, 7), margin=3):
    # Load the first image to get dimensions
    img_sample = Image.open(filenames[0])
    width, height = img_sample.size

    # Adjust dimensions for margin
    total_width = width + margin
    total_height = height + margin

    # Create a blank canvas for the spritesheet
    sheet_width = sheet_dimensions[0] * total_width - margin  # Subtract the margin at the last column
    sheet_height = sheet_dimensions[1] * total_height - margin  # Subtract the margin at the last row
    spritesheet = Image.new('RGBA', (sheet_width, sheet_height))

    # Iterate over each image and paste it onto the spritesheet
    for idx, filename in enumerate(filenames):
        img = Image.open(filename)
        
        # Calculate the position to paste the image on the spritesheet
        x = (idx % sheet_dimensions[0]) * total_width
        y = (idx // sheet_dimensions[0]) * total_height
        spritesheet.paste(img, (x, y))

    # Save the spritesheet
    spritesheet.save('spritesheet.png')


# Path to your Inkscape executable
OUTPUT_FOLDER = "card_images"

if not os.path.exists(OUTPUT_FOLDER):
    os.makedirs(OUTPUT_FOLDER)

# Load the JSON data
with open("card_data.json", "r") as json_file:
    cards = json.load(json_file)

def generate_card_images():
    
    card_imgs = []
    
    # For each card in the JSON array
    for card in cards:

        path = "./card_template_bug.svg"
        if card['type'] == 'building':
            path =  "./card_template_building.svg"


        with open(path, "r") as template_file:
            svg_content = template_file.read()

            if "art_path" not in card:
                card["art_path"] = art_path_from_name(card["name"])


            img_exists = os.path.isfile(card["art_path"])
        
            if not img_exists:
                card["art_path"] = 'art/placeholder.png'

            card['art_path'] = '/home/derek/Documents/gemberts_abdication/' + card['art_path']

            # Replace the placeholders with the card data
            svg_content = svg_content.replace("PL_CARDNAME", card["name"])

        

            svg_content = svg_content.replace("art/placeholder.png", card["art_path"])
            svg_content = svg_content.replace("PL_CARDTEXT", card["card_text"])
            svg_content = svg_content.replace("PL_FLAVORTEXT", card["flavor_text"])

            if card['type'] == 'bug':
                svg_content = svg_content.replace("PL_PPWR", str(card["production_power"]))
                svg_content = svg_content.replace("PL_CPWR", str(card["combat_power"]))
            elif card['type'] == 'building':
                svg_content = svg_content.replace("PL_COST", cost_str(card["cost"]))
                svg_content = svg_content.replace("PL_DEFENCE", symbols_replace['_defence']+ ' ' + str(card["defence"]))
                pass

            svg_content = replace_symbols(svg_content)

            # Use Inkscape to export the SVG to an image
            file_name = f"{card['name']}"
            file_name = file_name.replace(" ", "_")

            svg_file_name = f"{file_name}.svg"
            # Save the modified SVG to a temporary file
            with open(svg_file_name, "w") as temp_file:
                temp_file.write(svg_content)

            file_name_with_ext = f"{file_name}.png"
            output_image_path = os.path.join(OUTPUT_FOLDER, file_name_with_ext)
            args = ["inkscape", svg_file_name, "--export-filename", output_image_path, "-w", "407", "-h", "585"]
            print(args)
            subprocess.run(args)

            card_imgs.append(output_image_path)

        os.remove(svg_file_name)

    print("Done Generating Cards!")

    return card_imgs


card_imgs = generate_card_images()
create_spritesheet(card_imgs)
