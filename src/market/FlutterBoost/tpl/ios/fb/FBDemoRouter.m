//
//  FBDemoRouter.m
//  tios
//
//  Created by 兴往 on 2019/9/11.
//  Copyright © 2019 闲鱼. All rights reserved.
//

#import "FBDemoRouter.h"
#import <flutter_boost/FLBFlutterViewContainer.h>
#import <flutter_boost/FlutterBoostPlugin.h>

@implementation FBDemoRouter

+ (void)registerInFlutterBoost {
    [FlutterBoostPlugin.sharedInstance startFlutterWithPlatform:[self shared]
                                                        onStart:^(id engine) {

                                                        }];
}

+ (FBDemoRouter *)shared {
    static dispatch_once_t onceToken;
    static FBDemoRouter *instance;
    dispatch_once(&onceToken, ^{
        instance = [FBDemoRouter new];
    });
    return instance;
}

- (void)openPage:(NSString *)name
          params:(NSDictionary *)params
        animated:(BOOL)animated
            from:(UIViewController *)fromVC
      completion:(void (^)(BOOL))completion
{
    if([params[@"present"] boolValue]){
        FLBFlutterViewContainer *vc = FLBFlutterViewContainer.new;
        [vc setName:name params:params];
        [fromVC presentViewController:vc animated:animated completion:^{}];
    }else if([fromVC isKindOfClass:[UINavigationController class]]){
        FLBFlutterViewContainer *vc = FLBFlutterViewContainer.new;
        [vc setName:name params:params];
        [(UINavigationController *)fromVC pushViewController:vc animated:animated];
    }
}


- (void)closePage:(NSString *)uid animated:(BOOL)animated params:(NSDictionary *)params completion:(void (^)(BOOL))completion
{
    FLBFlutterViewContainer *vc = (id)self.navigationController.presentedViewController;
    if([vc isKindOfClass:FLBFlutterViewContainer.class] && [vc.uniqueIDString isEqual: uid]){
        [vc dismissViewControllerAnimated:animated completion:^{}];
    }else{
        [vc.navigationController popViewControllerAnimated:animated];
    }
}

#pragma mark - View Related
- (void)addEntryView:(UIViewController *)vc {
    UIViewController *root = [UIViewController new];
    UIButton *btn = [UIButton buttonWithType:UIButtonTypeCustom];
    CGRect bounds = [[UIScreen mainScreen]bounds];
    CGFloat width = 200;
    btn.frame = CGRectMake((CGRectGetWidth(bounds)-width)/2, 88, width, 44);
    [btn setTitle:@"Navigator to flutter" forState:UIControlStateNormal];
    [btn setBackgroundColor:[UIColor blueColor]];
    [btn setTitleColor:[UIColor blackColor] forState:UIControlStateNormal];
    [btn addTarget:self action:@selector(jump) forControlEvents:UIControlEventTouchUpInside];
    [root.view addSubview:btn];
    root.title = @"Hello World";
    root.view.backgroundColor = [UIColor whiteColor];
    self.navigationController = [[UINavigationController alloc]initWithRootViewController:root];
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.3 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        [vc presentViewController:self.navigationController animated:NO completion:nil];
    });
}

- (void)jump {
    [self openPage:@"demo://mypage" params:@{} animated:YES from:self.navigationController completion:nil];
}

@end
