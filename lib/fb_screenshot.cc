#include <napi.h>

#include <X11/Xlib.h>
#include <X11/Xutil.h>
#include <iostream>
#include <stdlib.h>


char *getImg(size_t *mem_size, const char* display_name)
{
    Display *display;
    XImage *img;
    // int x = 0;
    // int y = 0;
    int width = 0;
    int height = 0;
    Window window, root_return, parent_return, *children_return;
    unsigned int nchildren_return;
    XWindowAttributes attributes;

    //display = XOpenDisplay(NULL);
    display = XOpenDisplay(display_name);
    // no display
    if(!display){
        *mem_size = 0;
        return NULL;
    }

    window = DefaultRootWindow(display);
    XQueryTree(display, window, &root_return, &parent_return, &children_return, &nchildren_return);

    if (children_return)
    {

        bool state = false;
        int temp_width = 0;
        int temp_height = 0;
        while (nchildren_return--)
        {
            if (XGetWindowAttributes(display, children_return[nchildren_return], &attributes) && attributes.map_state == IsViewable)
            {
                // window = root_return; // children_return[nchildren_return];
                // if (temp_width < attributes.width)
                //     temp_width = attributes.width;
                // if (temp_height < attributes.height)
                //     temp_height = attributes.height;

                if (temp_width < attributes.x + attributes.width)
                    temp_width = attributes.x + attributes.width;
                if (temp_height < attributes.y + attributes.height)
                    temp_height = attributes.y + attributes.height;

                state = true;
                //break;
            }
        }

        if (state)
        {
            width = temp_width;
            height = temp_height;
        }
        else
        {
            // window = root_return;
            width = XDisplayWidth(display, 0);
            height = XDisplayHeight(display, 0);
        }
        XFree(children_return);
    }
    else
    {
        //window = root_return;
        width = XDisplayWidth(display, 0);
        height = XDisplayHeight(display, 0);
    }

    img = XGetImage(display, window, 0, 0, width, height, AllPlanes, ZPixmap);

    int bpp = (int)img->bits_per_pixel / 8; // 4

    char *buffer = (char *)malloc(sizeof(char) * bpp * img->width * img->height);

    *mem_size = sizeof(char) * bpp * img->width * img->height;

    memcpy(buffer, img->data, bpp * img->width * img->height);

    free(img->data);
    img->data = NULL;
    XDestroyImage(img);
    XCloseDisplay(display);

    return buffer;
}

void cleanup(Napi::Env env, void *arg)
{
    free(arg);
}

Napi::Value screenshot(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();

    std::string arg_str = info[0].As<Napi::String>();
    const char* display_name = arg_str.c_str();

    size_t msize;
    char *img = getImg(&msize, display_name);

    //return Napi::Buffer<char>::New(env, img, msize, cleanup);
    return Napi::Buffer<char>::NewOrCopy(env, img, msize, cleanup);
}

Napi::Value getScreenInfo(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();

    Display *display;
    XImage *img;
    int width = 0;
    int height = 0;
    Window window, root_return, parent_return, *children_return;
    unsigned int nchildren_return;
    XWindowAttributes attributes;

    //display = XOpenDisplay(NULL);
    std::string arg_str = info[0].As<Napi::String>();
    const char* display_name = arg_str.c_str();
    display = XOpenDisplay(display_name);
    // no display
    if(!display){
        Napi::Int32Array screenInfo = Napi::Int32Array::New(env, 4);

        screenInfo[0] = 0;
        screenInfo[1] = 0;
        screenInfo[2] = 0;
        screenInfo[3] = 0;
        
        return screenInfo;
    }

    window = DefaultRootWindow(display);
    XQueryTree(display, window, &root_return, &parent_return, &children_return, &nchildren_return);

    if (nchildren_return)
    {

        bool state = false;
        int temp_width = 0;
        int temp_height = 0;
        while (nchildren_return--)
        {
            if (XGetWindowAttributes(display, children_return[nchildren_return], &attributes) && attributes.map_state == IsViewable)
            {
                // window = root_return; // children_return[nchildren_return];
                // if (temp_width < attributes.width)
                //     temp_width = attributes.width;
                // if (temp_height < attributes.height)
                //     temp_height = attributes.height;

                if (temp_width < attributes.x + attributes.width)
                    temp_width = attributes.x + attributes.width;
                if (temp_height < attributes.y + attributes.height)
                    temp_height = attributes.y + attributes.height;

                state = true;
                // break;
            }
        }

        if (state){
            width = temp_width;
            height = temp_height;
        }else
        {
            //window = root_return;
            width = XDisplayWidth(display, 0);
            height = XDisplayHeight(display, 0);
        }
        XFree(children_return);
    }
    else
    {
        //window = root_return;
        width = XDisplayWidth(display, 0);
        height = XDisplayHeight(display, 0);
    }

    img = XGetImage(display, window, 0, 0, width, height, AllPlanes, ZPixmap);

    Napi::Int32Array screenInfo = Napi::Int32Array::New(env, 4);

    screenInfo[0] = width;
    screenInfo[1] = height;
    screenInfo[2] = img->depth;
    screenInfo[3] = img->bits_per_pixel;

    free(img->data);
    img->data = NULL;
    XDestroyImage(img);
    XCloseDisplay(display);

    return screenInfo;
}

//--- full screen
char *getImgFull(size_t *mem_size, const char* display_name)
{
    Display *display;
    XImage *img;

    //display = XOpenDisplay(NULL);
    display = XOpenDisplay(display_name);
    // no display
    if(!display){
        *mem_size = 0;
        return NULL;
    }

    Window window = DefaultRootWindow(display);
    int width = XDisplayWidth(display, 0);
    int height = XDisplayHeight(display, 0);

    img = XGetImage(display, window, 0, 0, width, height, AllPlanes, ZPixmap);

    int bpp = (int)img->bits_per_pixel / 8; // 4

    char *buffer = (char *)malloc(sizeof(char) * bpp * img->width * img->height);

    *mem_size = sizeof(char) * bpp * img->width * img->height;

    memcpy(buffer, img->data, bpp * img->width * img->height);

    free(img->data);
    img->data = NULL;
    XDestroyImage(img);
    XCloseDisplay(display);

    return buffer;
}

Napi::Value screenshotFull(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();

    std::string arg_str = info[0].As<Napi::String>();
    const char* display_name = arg_str.c_str();

    size_t msize;
    char *img = getImgFull(&msize, display_name);

    //return Napi::Buffer<char>::New(env, img, msize, cleanup);
    return Napi::Buffer<char>::NewOrCopy(env, img, msize, cleanup);
}

Napi::Value getFullScreenInfo(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();

    Display *display;
    XImage *img;
            
    //display = XOpenDisplay(NULL);
    std::string arg_str = info[0].As<Napi::String>();
    const char* display_name = arg_str.c_str();
    display = XOpenDisplay(display_name);
    // no display
    if(!display){
        Napi::Int32Array screenFullInfo = Napi::Int32Array::New(env, 4);

        screenFullInfo[0] = 0;
        screenFullInfo[1] = 0;
        screenFullInfo[2] = 0;
        screenFullInfo[3] = 0;
        return screenFullInfo;
    }

    Window window = DefaultRootWindow(display);
    int width = XDisplayWidth(display, 0);
    int height = XDisplayHeight(display, 0);

    img = XGetImage(display, window, 0, 0, width, height, AllPlanes, ZPixmap);

    Napi::Int32Array screenFullInfo = Napi::Int32Array::New(env, 4);

    screenFullInfo[0] = width;
    screenFullInfo[1] = height;
    screenFullInfo[2] = img->depth;
    screenFullInfo[3] = img->bits_per_pixel;

    free(img->data);
    img->data = NULL;
    XDestroyImage(img);
    XCloseDisplay(display);

    return screenFullInfo;
}


Napi::Object Init(Napi::Env env, Napi::Object exports)
{
    exports.Set(Napi::String::New(env, "screenshot"),
                Napi::Function::New(env, screenshot));
    exports.Set(Napi::String::New(env, "getScreenInfo"),
                Napi::Function::New(env, getScreenInfo));

    exports.Set(Napi::String::New(env, "screenshotFull"),
                Napi::Function::New(env, screenshotFull));
    exports.Set(Napi::String::New(env, "getFullScreenInfo"),
                Napi::Function::New(env, getFullScreenInfo));

    return exports;
}

NODE_API_MODULE(screenshot, Init);