import json
import os
import subprocess
from PIL import Image


# quick util fn to make sure the dirs exist 
def mkdir(dir):
    if not os.path.exists(dir):
        os.makedirs(dir)

data_path = 'data';
assets_path = 'assets'; mkdir(assets_path)
output_path = 'output'; mkdir(output_path)
dist_path = 'dist'; mkdir(output_path)
card_imgs_path = os.path.join(output_path, 'card_images'); mkdir(card_imgs_path)
building_imgs_path = os.path.join(output_path, 'building_images'); mkdir(building_imgs_path)
onus_imgs_path = os.path.join(output_path, 'onus_images'); mkdir(onus_imgs_path)
art_path = os.path.join(assets_path, 'art'); mkdir(art_path)
card_data_path = os.path.join(data_path, 'card_data.json')
building_data_path = os.path.join(data_path, 'building_data.json')
onus_data_path = os.path.join(data_path, 'onus_data.json')


def get_onuses():
    with open(onus_data_path, 'r') as json_file:
        return json.load(json_file)


def get_cards():
    with open(card_data_path, 'r') as json_file:
        return json.load(json_file)
    
    
def get_buildings():
    with open(building_data_path, 'r') as json_file:
        return json.load(json_file)


# gets all the images and combines them into a spritesheet
# based on the size of the first file and the specified dimensions
def create_spritesheet(ss_filename, filename_tuples, sheet_dimensions=(10, 7), margin=3):
    # Load the first image to get dimensions
    img_sample = Image.open(filename_tuples[0][0])
    width, height = img_sample.size

    # Adjust dimensions for margin
    total_width = width + margin
    total_height = height + margin

    # Create a blank canvas for the spritesheet
    sheet_width = sheet_dimensions[0] * total_width - margin  # Subtract the margin at the last column
    sheet_height = sheet_dimensions[1] * total_height - margin  # Subtract the margin at the last row
    spritesheet = Image.new('RGBA', (sheet_width, sheet_height))

    idx = 0
    # Iterate over each image and paste it onto the spritesheet
    for filename_tuple in filename_tuples:
        filename = filename_tuple[0]
        img = Image.open(filename)
     
        amount = filename_tuple[1]
        
        for _ in range(amount):
            # Calculate the position to paste the image on the spritesheet
            x = (idx % sheet_dimensions[0]) * total_width
            y = (idx // sheet_dimensions[0]) * total_height

            spritesheet.paste(img, (x, y))
            idx += 1

    # Save the spritesheet
    path = os.path.join(dist_path, f'{ss_filename}.png')
    spritesheet.save(path)

# gets the path to a default art png for a card, based on the card name
def art_path_from_name(name):
    name = name.replace(' ', '_')
    name = name.lower()
    path = os.path.join(art_path, f'{name}.png')
    return os.path.abspath(path)


# gets ore creates a path to some art, either defined or the placeholder art (in the ./art path)
def get_art_path(card_data, placeholder='placeholder'):
    if 'art_path' not in card_data:
        card_data['art_path'] = art_path_from_name(card_data['name'])

    img_exists = os.path.isfile(card_data['art_path'])
    if not img_exists:
        card_data['art_path'] = os.path.abspath(os.path.join(art_path, f'{placeholder}.png'))

    return card_data['art_path']

# generates an image for each card in the data file
def generate_card_images():
    
    card_imgs = []
    
    # For each card in the JSON array
    for card_data in get_cards():

        template_file_path = os.path.join(assets_path, 'svgs', 'card_template_bug.svg')

        with open(template_file_path, 'r') as template_file:
            svg_content = template_file.read()

            # Replace the placeholders with the card data
            svg_content = svg_content.replace('PL_CARDNAME', card_data['name'])
            svg_content = svg_content.replace('PL_ART_PATH', get_art_path(card_data))
            svg_content = svg_content.replace('PL_CARDTEXT', card_data['card_text'])
            svg_content = svg_content.replace('PL_FLAVORTEXT', card_data['flavor_text'])
            svg_content = svg_content.replace('PL_PPWR', '⚔️ ' + str(card_data['production_power']))
            svg_content = svg_content.replace('PL_CPWR', '⚒️ ' + str(card_data['combat_power']))

            # Use Inkscape to export the SVG to an image
            file_name = f'{card_data["name"]}'
            file_name = file_name.replace(' ', '_')

            # use the assets path to keep relative link context working
            svg_file_name = os.path.join(assets_path, 'svgs', f'{file_name}.svg')

            # Save the modified SVG to a temporary file
            with open(svg_file_name, 'w') as temp_file:
                temp_file.write(svg_content)

            file_name_with_ext = f'{file_name}.png'
            output_image_path = os.path.join(card_imgs_path, file_name_with_ext)
            args = ['inkscape', svg_file_name, '--export-filename', output_image_path, '-w', '407', '-h', '585']
            print(args)
            subprocess.run(args)

            card_imgs.append(output_image_path)

        os.remove(svg_file_name)

    print('Done Generating Cards!')

    return card_imgs


def generate_building_images():
    card_imgs = []

    for card_data in get_buildings():

        template_file_path = os.path.join(assets_path, 'svgs', 'building_tile_template.svg')

        with open(template_file_path, 'r') as template_file:
            svg_content = template_file.read()

            # Replace the placeholders with the card data
            svg_content = svg_content.replace('PL_CARDNAME', card_data['name'])
            svg_content = svg_content.replace('PL_ART_PATH', get_art_path(card_data, 'placeholder_building'))
            svg_content = svg_content.replace('PL_CARDTEXT', card_data['card_text'])
            svg_content = svg_content.replace('PL_FLAVORTEXT', card_data['flavor_text'])
            svg_content = svg_content.replace('PL_OUTCOME', card_data['outcome_str'])
            svg_content = svg_content.replace('PL_TIER', str(card_data['tier']))

            # Use Inkscape to export the SVG to an image
            file_name = f'{card_data["name"]}'
            file_name = file_name.replace(' ', '_')

            # use the assets path to keep relative link context working
            svg_file_name = os.path.join(assets_path, 'svgs', f'{file_name}.svg')

            # Save the modified SVG to a temporary file
            with open(svg_file_name, 'w') as temp_file:
                temp_file.write(svg_content)

            file_name_with_ext = f'{file_name}.png'
            output_image_path = os.path.join(building_imgs_path, file_name_with_ext)
            args = ['inkscape', svg_file_name, '--export-filename', output_image_path, '-w', '407', '-h', '408']
            print(args)
            subprocess.run(args)

            card_imgs.append((output_image_path, card_data['amount']))

        os.remove(svg_file_name)

    print('Done Generating Cards!')

    return card_imgs


# generates an image for each card in the data file
def generate_card_images():
    
    card_imgs = []
    
    # For each card in the JSON array
    for card_data in get_cards():

        template_file_path = os.path.join(assets_path, 'svgs', 'card_template_bug.svg')

        with open(template_file_path, 'r') as template_file:
            svg_content = template_file.read()

            # Replace the placeholders with the card data
            svg_content = svg_content.replace('PL_CARDNAME', card_data['name'])
            svg_content = svg_content.replace('PL_ART_PATH', get_art_path(card_data))
            svg_content = svg_content.replace('PL_CARDTEXT', card_data['card_text'])
            svg_content = svg_content.replace('PL_FLAVORTEXT', card_data['flavor_text'])
            svg_content = svg_content.replace('PL_PPWR', '⚔️ ' + str(card_data['production_power']))
            svg_content = svg_content.replace('PL_CPWR', '⚒️ ' + str(card_data['combat_power']))

            # Use Inkscape to export the SVG to an image
            file_name = f'{card_data["name"]}'
            file_name = file_name.replace(' ', '_')

            # use the assets path to keep relative link context working
            svg_file_name = os.path.join(assets_path, 'svgs', f'{file_name}.svg')

            # Save the modified SVG to a temporary file
            with open(svg_file_name, 'w') as temp_file:
                temp_file.write(svg_content)

            file_name_with_ext = f'{file_name}.png'
            output_image_path = os.path.join(card_imgs_path, file_name_with_ext)
            args = ['inkscape', svg_file_name, '--export-filename', output_image_path, '-w', '407', '-h', '585']
            print(args)
            subprocess.run(args)

            card_imgs.append(output_image_path)

        os.remove(svg_file_name)

    print('Done Generating Cards!')

    return card_imgs


def generate_onus_images():
    onus_imgs = []

    for onus_data in get_onuses():

        template_file_path = os.path.join(assets_path, 'svgs', 'onus_tile_template.svg')

        with open(template_file_path, 'r') as template_file:
            svg_content = template_file.read()

            # Replace the placeholders with the card data
            svg_content = svg_content.replace('PL_NAME', onus_data['name'])
            svg_content = svg_content.replace('PL_ART_PATH', get_art_path(onus_data, 'placeholder_building'))
            svg_content = svg_content.replace('PL_FLAVORTEXT', onus_data['flavor_text'])
            svg_content = svg_content.replace('PL_TAX', onus_data['tax_str'])

            # Use Inkscape to export the SVG to an image
            file_name = f'{onus_data["name"]}'
            file_name = file_name.replace(' ', '_')

            # use the assets path to keep relative link context working
            svg_file_name = os.path.join(assets_path, 'svgs', f'{file_name}.svg')

            # Save the modified SVG to a temporary file
            with open(svg_file_name, 'w') as temp_file:
                temp_file.write(svg_content)

            file_name_with_ext = f'{file_name}.png'
            output_image_path = os.path.join(onus_imgs_path, file_name_with_ext)
            args = ['inkscape', svg_file_name, '--export-filename', output_image_path, '-w', '407', '-h', '408']
            print(args)
            subprocess.run(args)

            onus_imgs.append((output_image_path, onus_data['amount']))

        os.remove(svg_file_name)

    print('Done Generating Cards!')

    return onus_imgs
    

os.system("node build_data.js")

onus_imgs = generate_onus_images()
create_spritesheet('onuses', onus_imgs, (10, 7), 1)

# card_imgs = generate_card_images()
# create_spritesheet('cards', card_imgs, (10, 7), 3)

# building_imgs = generate_building_images()
# create_spritesheet('buildings', building_imgs, (10, 7), 1)