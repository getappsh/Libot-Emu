import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { AxiosError } from 'axios';
import { Request, Response } from 'express';

/**
 * Catch all exceptions and handle RPC exceptions
 * Custom exception filter for RPC exceptions
 */
@Catch()
export class CustomRpcExceptionFilter implements ExceptionFilter {
  
  private readonly logger = new Logger(CustomRpcExceptionFilter.name);

  catch(exception: RpcException | HttpException | Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let data, error, error_http_code, error_message, error_stack;

    try {
      error = JSON.parse(exception.message);
    } catch (e) {
      error = exception.message;
    }

    if (exception instanceof RpcException) {
      data = error;
      error_http_code = error.code || 500;
      error_message = error.message || 'Error message not provided';
      error_stack = error.stack || 'Error stack not provided';

    } else if (exception instanceof HttpException) {
      data = exception.getResponse()['data'] || exception.getResponse();
      error_http_code = exception.getStatus();
      error_message = exception.getResponse()['message']
        ? exception.getResponse()['message']
        : exception.message || 'Error message not provided';
      error_stack = exception.stack;
      
    } else if (exception instanceof AxiosError){
      data = exception.response?.data
      error_http_code = exception.response?.status;
      error_message = exception.message;
      error_stack = exception.stack;

    } else {
      data = {};
      error_http_code = 500;
      error_message = exception.message || 'UNKNOWN Internal server error';
      error_stack = exception.stack || [];

      try {
        error_message = JSON.parse(exception.message);
        
        if (error_message.stack) {
          error_stack = `${error_message.stack}`;
        }

        if (error_message.code) {
          error_http_code = error_message.code;
        }

        if (error_message.error_data) {
          data = error_message.error_data;
        }

        if (error_message.message) {
          error_message = error_message.message;
        }
      } catch (error) {
        error_message = exception.message;

      }
    }
    this.logger.error(`${error_message}`, error_stack)

    try {
      response.status(error_http_code).json({
        name: exception.name,
        statusCode: error_http_code,
        message: error_message,
        // stack: error_stack,
        // data: data,
        timestamp: new Date().toISOString(),
        path: request.url,
      });

    } catch (e) {
      // Maybe details are not in json format, send simple text
      response.status(500).json({
        statusCode: 500,
        message: error_message,
        // stack: error_stack,
        // data: data,
        timestamp: new Date().toISOString(),
        path: request.url,
      });

    }

  }
}