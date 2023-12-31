import json
import os
import sys
import subprocess
from PIL import Image


def should_regenerate(obj):
    if 'name' not in obj:
        return True
    
    if len(sys.argv) < 2:
        return True

    arg_name = sys.argv[1]
    return arg_name.lower().strip() == str(obj['name']).lower().strip()

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
hand_card_data_path = os.path.join(data_path, 'hand_cards_data.json')
market_card_data_path = os.path.join(data_path, 'market_cards_data.json')
building_data_path = os.path.join(data_path, 'building_data.json')
onus_data_path = os.path.join(data_path, 'onus_data.json')


def default(data, key, default=None):
    if key in data:
        return data[key]
    else:
        return default


def get_onuses():
    with open(onus_data_path, 'r') as json_file:
        return json.load(json_file)


def get_hand_cards():
    with open(hand_card_data_path, 'r') as json_file:
        return json.load(json_file)
    

def get_market_cards():
    with open(market_card_data_path, 'r') as json_file:
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
    print('Done creating spritesheet ', path)

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


def generate_images(datasource, template_file_path, output_dir, placeholder_art='placeholder', w=407, h=407):
    imgs = []

    
    for data in datasource:

        with open(template_file_path, 'r') as template_file:
            svg_content = template_file.read()

            def replace(token, key):
                if key in data:
                    value = data[key]
                    return svg_content.replace(token, str(value))
                else:
                    return svg_content.replace(token, '')

            # Replace the placeholders with the card data
            svg_content = replace('_NAME', 'name')
            svg_content = replace('_TEXT', 'card_text')
            svg_content = replace('_FLAV', 'flavor_text')
            svg_content = replace('_OUTC', 'outcome_str')
            svg_content = replace('_TIER', 'tier')
            svg_content = replace('_PROF', 'profits_str')
            svg_content = replace('_TYPA', 'type_a')
            svg_content = replace('_TYPB', 'type_b')
            svg_content = replace('_TAX', 'tax_str')
            svg_content = replace('_BOON', 'bonus_str')
            svg_content = replace('_COST', 'cost')
            svg_content = replace('_MANA', 'mana')

            svg_content = svg_content.replace('_ART', get_art_path(data, placeholder_art))

            # Use Inkscape to export the SVG to an image
            file_name = f'{data["name"]}'
            file_name = file_name.replace(' ', '_')

            # use the assets path to keep relative link context working
            temp_svg_file_name = os.path.join(assets_path, 'svgs', f'{file_name}.svg')

            # Save the modified SVG to a temporary file
            with open(temp_svg_file_name, 'w') as temp_file:
                temp_file.write(svg_content)

            file_name_with_ext = f'{file_name}.png'
            output_image_path = os.path.join(output_dir, file_name_with_ext)

            if should_regenerate(data):
                args = ['inkscape', temp_svg_file_name, '--export-filename', output_image_path, '-w', str(w), '-h', str(h)]
                print(args)
                subprocess.run(args)

            imgs.append((output_image_path, default(data, 'amount', 1)))

        os.remove(temp_svg_file_name)

    print('Done generating images!')

    return imgs


os.system("node build_data.js")



if 1:
    card_imgs = generate_images(
        get_hand_cards(), 
        os.path.join(assets_path, 'svgs', 'template_card.svg'),
        card_imgs_path,
        'placeholder_card',
        w=407,
        h=585,
    )
    create_spritesheet('hand_cards', card_imgs, (10, 7), 3)

    card_imgs = generate_images(
        get_market_cards(), 
        os.path.join(assets_path, 'svgs', 'template_card.svg'),
        card_imgs_path,
        'placeholder_card',
        w=407,
        h=585,
    )
    create_spritesheet('market_cards', card_imgs, (10, 7), 3)

if 0:
    building_imgs = generate_images(
        get_buildings(), 
        os.path.join(assets_path, 'svgs', 'template_building.svg'),
        building_imgs_path,
        'placeholder_building',
        w=407,
        h=407,
    )
    create_spritesheet('buildings', building_imgs, (10, 7), 1)

if 0:
    onus_imgs = generate_images(
        get_onuses(), 
        os.path.join(assets_path, 'svgs', 'template_onus.svg'),
        onus_imgs_path,
        'placeholder_building',
        w=407,
        h=407,
    )
    create_spritesheet('onuses', onus_imgs, (10, 7), 1)
