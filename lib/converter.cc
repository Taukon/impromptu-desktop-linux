#include <napi.h>

#include <iostream>
#include <stdlib.h>
#include <jpeglib.h>

char *getJpegImg(size_t *mem_size, char *fb, int width, int height, int depth, int fb_bpp)
{

    char *mem = NULL;
    int bpp = fb_bpp / 8;

    char *buffer;
    struct jpeg_compress_struct cinfo;
    struct jpeg_error_mgr jerr;
    JSAMPROW row_pointer;

    buffer = (char *)malloc(sizeof(char) * 3 * width * height);
    for (int y = 0; y < height; y++)
    {
        for (int x = 0; x < width; x++)
        {
            buffer[(y * width + x) * 3 + 0] = fb[(y * width + x) * bpp + 2] & 0xff;
            buffer[(y * width + x) * 3 + 1] = fb[(y * width + x) * bpp + 1] & 0xff;
            buffer[(y * width + x) * 3 + 2] = fb[(y * width + x) * bpp + 0] & 0xff;
        }
    }

    cinfo.err = jpeg_std_error(&jerr);
    jpeg_create_compress(&cinfo);

    jpeg_mem_dest(&cinfo, (unsigned char **)&mem, mem_size);

    cinfo.image_width = width;
    cinfo.image_height = height;
    cinfo.input_components = 3;
    cinfo.in_color_space = JCS_RGB;

    jpeg_set_defaults(&cinfo);
    jpeg_set_quality(&cinfo, 85, TRUE);
    jpeg_start_compress(&cinfo, TRUE);

    while (cinfo.next_scanline < cinfo.image_height)
    {
        row_pointer = (JSAMPROW)&buffer[cinfo.next_scanline * (depth >> 3) * width];
        jpeg_write_scanlines(&cinfo, &row_pointer, 1);
    }
    free(buffer);
    buffer = NULL;
    jpeg_finish_compress(&cinfo);

    return mem;
}

void cleanupbuf(Napi::Env env, void *arg)
{
    free(arg);
}

Napi::Value convert(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();

    Napi::Buffer<char> input_data = info[0].As<Napi::Buffer<char>>();
    int width = info[1].As<Napi::Number>().Int32Value();
    int height = info[2].As<Napi::Number>().Int32Value();
    int depth = info[3].As<Napi::Number>().Int32Value();
    int fb_bpp = info[4].As<Napi::Number>().Int32Value();

    size_t msize;
    char *imgJpeg = getJpegImg(&msize, input_data.Data(), width, height, depth, fb_bpp);

    //return Napi::Buffer<char>::New(env, imgJpeg, msize, cleanupbuf);
    return Napi::Buffer<char>::NewOrCopy(env, imgJpeg, msize, cleanupbuf);
}


Napi::Object Init(Napi::Env env, Napi::Object exports)
{
    exports.Set(Napi::String::New(env, "convert"),
                Napi::Function::New(env, convert));
    return exports;
}

NODE_API_MODULE(converter, Init);